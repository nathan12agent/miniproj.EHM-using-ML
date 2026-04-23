const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const DoctorAvailability = require('../models/DoctorAvailability');
const Slot = require('../models/Slot');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

// ──────────────────────────────────────────────
// HELPER: Generate time slots from a time range
// ──────────────────────────────────────────────
function generateTimeSlotsFromRange(startTime, endTime, durationMinutes) {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentMinutes += durationMinutes;
  }
  return slots;
}

// ──────────────────────────────────────────────
// 1. SET DOCTOR AVAILABILITY (Doctor only)
// ──────────────────────────────────────────────
/**
 * @swagger
 * /api/scheduling/availability:
 *   post:
 *     summary: Set doctor availability for a day
 *     tags: [Scheduling]
 */
router.post('/availability', auth, [
  body('dayOfWeek').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  body('timeRanges').isArray({ min: 1 }).withMessage('At least one time range is required'),
  body('timeRanges.*.startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid start time format (HH:mm)'),
  body('timeRanges.*.endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid end time format (HH:mm)'),
  body('slotDuration').optional().isIn([10, 15]).withMessage('Slot duration must be 10 or 15 minutes'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { dayOfWeek, timeRanges, slotDuration } = req.body;

    // Validate that endTime > startTime for each range
    for (const range of timeRanges) {
      const [sh, sm] = range.startTime.split(':').map(Number);
      const [eh, em] = range.endTime.split(':').map(Number);
      if (sh * 60 + sm >= eh * 60 + em) {
        return res.status(400).json({ message: `End time must be after start time: ${range.startTime} - ${range.endTime}` });
      }
    }

    // Upsert availability for this doctor + day
    const availability = await DoctorAvailability.findOneAndUpdate(
      { doctor: doctor._id, dayOfWeek },
      {
        doctor: doctor._id,
        dayOfWeek,
        timeRanges,
        slotDuration: slotDuration || 15,
        isActive: true
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Also update the Doctor's built-in schedule for backward compatibility
    const scheduleUpdate = {};
    scheduleUpdate[`schedule.${dayOfWeek}.isAvailable`] = true;
    scheduleUpdate[`schedule.${dayOfWeek}.startTime`] = timeRanges[0].startTime;
    scheduleUpdate[`schedule.${dayOfWeek}.endTime`] = timeRanges[timeRanges.length - 1].endTime;
    await Doctor.findByIdAndUpdate(doctor._id, { $set: scheduleUpdate });

    res.json({
      message: 'Availability set successfully',
      availability
    });
  } catch (error) {
    console.error('Set availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ──────────────────────────────────────────────
// 2. GET DOCTOR AVAILABILITY (Doctor's own)
// ──────────────────────────────────────────────
router.get('/availability', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const availability = await DoctorAvailability.find({ doctor: doctor._id, isActive: true })
      .sort({ dayOfWeek: 1 });

    res.json({ availability, consultationFee: doctor.consultationFee || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// 3. DELETE AVAILABILITY FOR A DAY
// ──────────────────────────────────────────────
router.delete('/availability/:dayOfWeek', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    await DoctorAvailability.findOneAndUpdate(
      { doctor: doctor._id, dayOfWeek: req.params.dayOfWeek },
      { isActive: false }
    );

    // Update Doctor schedule
    const scheduleUpdate = {};
    scheduleUpdate[`schedule.${req.params.dayOfWeek}.isAvailable`] = false;
    await Doctor.findByIdAndUpdate(doctor._id, { $set: scheduleUpdate });

    res.json({ message: 'Availability removed for ' + req.params.dayOfWeek });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// 4. SET CONSULTATION FEE (Doctor)
// ──────────────────────────────────────────────
router.put('/consultation-fee', auth, [
  body('fee').isNumeric().withMessage('Fee must be a number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user.id },
      { consultationFee: req.body.fee },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json({ message: 'Consultation fee updated', consultationFee: doctor.consultationFee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// 5. GENERATE / GET SLOTS FOR A DOCTOR ON A DATE (Public)
// ──────────────────────────────────────────────
/**
 * @swagger
 * /api/scheduling/slots/{doctorId}:
 *   get:
 *     summary: Get available slots for a doctor on a specific date
 *     tags: [Scheduling]
 */
router.get('/slots/:doctorId', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date query parameter is required (YYYY-MM-DD)' });
    }

    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const requestedDate = new Date(date);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[requestedDate.getDay()];

    // Check DoctorAvailability first
    const availability = await DoctorAvailability.findOne({
      doctor: doctor._id,
      dayOfWeek,
      isActive: true
    });

    let timeSlots = [];
    let slotDuration = 15;

    if (availability) {
      // Use DoctorAvailability (new system)
      slotDuration = availability.slotDuration || 15;
      for (const range of availability.timeRanges) {
        const rangeSlots = generateTimeSlotsFromRange(range.startTime, range.endTime, slotDuration);
        timeSlots.push(...rangeSlots);
      }
    } else {
      // Fallback to Doctor.schedule (old system)
      const daySchedule = doctor.schedule ? doctor.schedule[dayOfWeek] : null;
      if (!daySchedule || !daySchedule.isAvailable) {
        return res.json({
          slots: [],
          message: 'Doctor is not available on this day',
          doctor: { firstName: doctor.firstName, lastName: doctor.lastName, consultationFee: doctor.consultationFee }
        });
      }
      timeSlots = generateTimeSlotsFromRange(daySchedule.startTime, daySchedule.endTime, 15);
    }

    // Find existing booked appointments for this doctor on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctor: req.params.doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Cancelled', 'No Show'] }
    });

    const bookedTimes = new Set(existingAppointments.map(apt => apt.appointmentTime));

    // Also check Slot collection for any booked slots
    const existingSlots = await Slot.find({
      doctor: req.params.doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'booked'
    });
    existingSlots.forEach(slot => bookedTimes.add(slot.time));

    const slots = timeSlots.map(time => ({
      time,
      available: !bookedTimes.has(time),
      duration: slotDuration
    }));

    res.json({
      slots,
      slotDuration,
      doctor: {
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        consultationFee: doctor.consultationFee
      }
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// 6. BOOK APPOINTMENT (Patient Portal / Public)
// ──────────────────────────────────────────────
/**
 * @swagger
 * /api/scheduling/book:
 *   post:
 *     summary: Book an appointment slot
 *     tags: [Scheduling]
 */
router.post('/book', [
  body('doctorId').notEmpty().withMessage('Doctor is required'),
  body('appointmentDate').isISO8601().withMessage('Valid date is required'),
  body('appointmentTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time is required (HH:mm)'),
  body('patientName').notEmpty().withMessage('Patient name is required'),
  body('patientEmail').isEmail().withMessage('Valid email is required'),
  body('patientPhone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  // Use a session for atomic booking to prevent double-booking
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ errors: errors.array() });
    }

    const { doctorId, appointmentDate, appointmentTime, patientName, patientEmail, patientPhone, reason, type, visitType } = req.body;

    // Check for existing booking at this slot (double-booking prevention)
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      appointmentTime: appointmentTime,
      status: { $nin: ['Cancelled', 'No Show'] }
    }).session(session);

    if (existingAppointment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ message: 'This time slot is already booked. Please choose another slot.' });
    }

    // Find or create patient
    let patient = await Patient.findOne({ email: patientEmail.toLowerCase() }).session(session);
    if (!patient) {
      const nameParts = patientName.split(' ');
      patient = new Patient({
        firstName: nameParts[0] || patientName,
        lastName: nameParts.slice(1).join(' ') || '',
        email: patientEmail.toLowerCase(),
        phone: patientPhone,
        status: 'Active'
      });
      await patient.save({ session });
    }

    // Get doctor for fee info
    const doctor = await Doctor.findById(doctorId).session(session);
    if (!doctor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Create the appointment
    const count = await Appointment.countDocuments().session(session);
    const appointment = new Appointment({
      appointmentId: `APT${String(count + 1).padStart(6, '0')}`,
      patient: patient._id,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      type: type || 'Consultation',
      visitType: visitType || 'Outpatient',
      reason: reason || '',
      status: 'Scheduled',
      consultationFee: doctor.consultationFee || 0
    });

    await appointment.save({ session });

    // Create/update slot record
    await Slot.findOneAndUpdate(
      { doctor: doctorId, date: startOfDay, time: appointmentTime },
      {
        doctor: doctorId,
        date: startOfDay,
        time: appointmentTime,
        status: 'booked',
        appointment: appointment._id
      },
      { upsert: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName patientId email phone')
      .populate('doctor', 'firstName lastName specialization consultationFee');

    res.status(201).json({
      message: 'Appointment booked successfully!',
      appointment: populatedAppointment
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Booking error:', error);

    // Fallback without session for standalone MongoDB (no replica set)
    if (error.message && error.message.includes('transaction')) {
      try {
        return await bookWithoutTransaction(req, res);
      } catch (fallbackError) {
        console.error('Fallback booking error:', fallbackError);
        return res.status(500).json({ message: 'Server error', error: fallbackError.message });
      }
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fallback booking function without transactions (for standalone MongoDB)
async function bookWithoutTransaction(req, res) {
  const { doctorId, appointmentDate, appointmentTime, patientName, patientEmail, patientPhone, reason, type, visitType } = req.body;

  const startOfDay = new Date(appointmentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(appointmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Double-booking check
  const existingAppointment = await Appointment.findOne({
    doctor: doctorId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    appointmentTime: appointmentTime,
    status: { $nin: ['Cancelled', 'No Show'] }
  });

  if (existingAppointment) {
    return res.status(409).json({ message: 'This time slot is already booked. Please choose another slot.' });
  }

  let patient = await Patient.findOne({ email: patientEmail.toLowerCase() });
  if (!patient) {
    const nameParts = patientName.split(' ');
    patient = new Patient({
      firstName: nameParts[0] || patientName,
      lastName: nameParts.slice(1).join(' ') || '',
      email: patientEmail.toLowerCase(),
      phone: patientPhone,
      status: 'Active'
    });
    await patient.save();
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }

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
    status: 'Scheduled',
    consultationFee: doctor.consultationFee || 0
  });

  await appointment.save();

  // Update slot
  await Slot.findOneAndUpdate(
    { doctor: doctorId, date: startOfDay, time: appointmentTime },
    {
      doctor: doctorId,
      date: startOfDay,
      time: appointmentTime,
      status: 'booked',
      appointment: appointment._id
    },
    { upsert: true }
  );

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('patient', 'firstName lastName patientId email phone')
    .populate('doctor', 'firstName lastName specialization consultationFee');

  res.status(201).json({
    message: 'Appointment booked successfully!',
    appointment: populatedAppointment
  });
}

// ──────────────────────────────────────────────
// 7. GET DOCTOR'S APPOINTMENTS (Authenticated doctor)
// ──────────────────────────────────────────────
router.get('/doctor/appointments', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { status, date, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    let query = { doctor: doctor._id };

    if (status) query.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName patientId phone email dateOfBirth gender')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// 8. GET PATIENT'S APPOINTMENTS (by email, public)
// ──────────────────────────────────────────────
router.get('/patient/appointments', async (req, res) => {
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

// ──────────────────────────────────────────────
// 9. GET ALL APPOINTMENTS (Admin)
// ──────────────────────────────────────────────
router.get('/admin/appointments', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { page = 1, limit = 20, status, doctorId, date } = req.query;
    const skip = (page - 1) * limit;
    let query = {};

    if (status) query.status = status;
    if (doctorId) query.doctor = doctorId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName patientId phone email')
      .populate('doctor', 'firstName lastName specialization consultationFee')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// 10. GET PUBLIC DOCTOR LIST WITH AVAILABILITY
// ──────────────────────────────────────────────
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

    // Enrich with DoctorAvailability data
    const enrichedDoctors = await Promise.all(doctors.map(async (doc) => {
      const docObj = doc.toObject();
      const availability = await DoctorAvailability.find({ doctor: doc._id, isActive: true });
      docObj.availabilitySlots = availability;
      return docObj;
    }));

    res.json({ doctors: enrichedDoctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// 11. CANCEL APPOINTMENT
// ──────────────────────────────────────────────
router.put('/cancel/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.appointmentId,
      { status: 'Cancelled' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Free up the slot
    const startOfDay = new Date(appointment.appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);

    await Slot.findOneAndUpdate(
      { doctor: appointment.doctor, date: startOfDay, time: appointment.appointmentTime },
      { status: 'available', appointment: null }
    );

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
