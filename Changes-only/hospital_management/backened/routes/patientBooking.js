const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

/**
 * @swagger
 * /api/patient-portal/doctors:
 *   get:
 *     summary: Get all active doctors for patient portal
 *     tags: [Patient Portal]
 */
router.get('/doctors', async (req, res) => {
  try {
    const { specialization, search } = req.query;

    let query = { status: 'Active' };
    if (specialization) query.specialization = specialization;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    const doctors = await Doctor.find(query)
      .select('firstName lastName specialization experience consultationFee schedule metrics profileImage bio languages')
      .sort({ 'metrics.patientSatisfactionScore': -1 });

    res.json({ doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/patient-portal/doctors/{id}/slots:
 *   get:
 *     summary: Get available time slots for a doctor on a given date
 *     tags: [Patient Portal]
 */
router.get('/doctors/:id/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date query parameter is required' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const requestedDate = new Date(date);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[requestedDate.getDay()];
    const daySchedule = doctor.schedule ? doctor.schedule[dayName] : null;

    if (!daySchedule || !daySchedule.isAvailable) {
      return res.json({ slots: [], message: 'Doctor is not available on this day' });
    }

    // Generate 15-minute slots
    const startHour = parseInt(daySchedule.startTime.split(':')[0]);
    const startMin = parseInt(daySchedule.startTime.split(':')[1] || '0');
    const endHour = parseInt(daySchedule.endTime.split(':')[0]);
    const endMin = parseInt(daySchedule.endTime.split(':')[1] || '0');

    const slots = [];
    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);
      currentMin += 15;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin -= 60;
      }
    }

    // Find existing appointments for this doctor on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctor: req.params.id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Cancelled', 'No Show'] }
    });

    const bookedTimes = existingAppointments.map(apt => apt.appointmentTime);
    const availableSlots = slots.map(slot => ({
      time: slot,
      available: !bookedTimes.includes(slot)
    }));

    res.json({ slots: availableSlots, doctor: { firstName: doctor.firstName, lastName: doctor.lastName } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/patient-portal/appointments:
 *   post:
 *     summary: Book an appointment (patient portal)
 *     tags: [Patient Portal]
 */
router.post('/appointments', [
  body('doctorId').notEmpty().withMessage('Doctor is required'),
  body('appointmentDate').isISO8601().withMessage('Valid date is required'),
  body('appointmentTime').notEmpty().withMessage('Time slot is required'),
  body('patientName').notEmpty().withMessage('Patient name is required'),
  body('patientEmail').isEmail().withMessage('Valid email is required'),
  body('patientPhone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { doctorId, appointmentDate, appointmentTime, patientName, patientEmail, patientPhone, reason, type, visitType } = req.body;

    // Find or create patient by email
    let patient = await Patient.findOne({ email: patientEmail });
    if (!patient) {
      const nameParts = patientName.split(' ');
      patient = new Patient({
        firstName: nameParts[0] || patientName,
        lastName: nameParts.slice(1).join(' ') || '',
        email: patientEmail,
        phone: patientPhone,
        status: 'Active'
      });
      await patient.save();
    }

    // Check for duplicate booking
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      appointmentTime: appointmentTime,
      status: { $nin: ['Cancelled', 'No Show'] }
    });

    if (existingAppointment) {
      return res.status(409).json({ message: 'This time slot is already booked. Please choose another slot.' });
    }

    // Create appointment
    const count = await Appointment.countDocuments();
    const appointment = new Appointment({
      appointmentId: `APT${String(count + 1).padStart(6, '0')}`,
      patient: patient._id,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      type: type || 'Consultation',
      visitType: visitType || 'Outpatient',
      reason: reason || '',
      status: 'Scheduled'
    });

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName patientId email phone')
      .populate('doctor', 'firstName lastName specialization consultationFee');

    res.status(201).json({
      message: 'Appointment booked successfully!',
      appointment: populatedAppointment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/patient-portal/appointments:
 *   get:
 *     summary: Get appointments for a patient by email
 *     tags: [Patient Portal]
 */
router.get('/appointments', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required' });
    }

    const patient = await Patient.findOne({ email: email.toLowerCase() });
    if (!patient) {
      return res.json({ appointments: [] });
    }

    const appointments = await Appointment.find({ patient: patient._id })
      .populate('doctor', 'firstName lastName specialization consultationFee')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.json({ appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/patient-portal/specializations:
 *   get:
 *     summary: Get list of available specializations
 *     tags: [Patient Portal]
 */
router.get('/specializations', async (req, res) => {
  try {
    const specializations = await Doctor.distinct('specialization', { status: 'Active' });
    res.json({ specializations: specializations.filter(Boolean) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
