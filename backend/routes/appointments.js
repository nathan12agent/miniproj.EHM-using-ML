const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 */
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, doctorId, patientId, date } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (doctorId) query.doctor = doctorId;
    if (patientId) query.patient = patientId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const rawAppointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName patientId phone')
      .populate('doctor', 'firstName lastName specialization consultationFee')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Ensure consultationFee is always the effective fee (stored or from doctor)
    const appointments = rawAppointments.map(apt => {
      const obj = apt.toObject();
      if (!obj.consultationFee && obj.doctor?.consultationFee) {
        obj.consultationFee = obj.doctor.consultationFee;
      }
      return obj;
    });

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

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient')
      .populate('doctor');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create new appointment
 *     tags: [Appointments]
 */
router.post('/', auth, [
  body('patient').notEmpty().withMessage('Patient is required'),
  body('doctor').notEmpty().withMessage('Doctor is required'),
  body('appointmentDate').isISO8601().withMessage('Invalid appointment date'),
  body('appointmentTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format. Use HH:MM')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { doctor: doctorId, appointmentDate, appointmentTime } = req.body;

    // Validate doctor exists and is active
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    if (doctor.status !== 'Active') return res.status(400).json({ message: 'Doctor is not currently available' });

    const aptDate = new Date(appointmentDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (aptDate < today) return res.status(400).json({ message: 'Cannot book appointments in the past' });

    // Validate time slot
    if (!doctor.isValidTimeSlot(aptDate, appointmentTime)) {
      return res.status(400).json({
        message: 'Invalid time slot. Please choose from available slots.',
        hint: `Use GET /api/doctors/${doctorId}/available-slots?date=${appointmentDate.split('T')[0]} to see available slots`
      });
    }

    // Check for double-booking
    const startOfDay = new Date(aptDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(aptDate); endOfDay.setHours(23, 59, 59, 999);
    const existing = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      appointmentTime,
      status: { $nin: ['Cancelled', 'No Show'] }
    });
    if (existing) {
      return res.status(409).json({ message: 'This time slot is already booked. Please choose another slot.' });
    }

    const appointment = new Appointment({ ...req.body, createdBy: req.user.id });
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor', 'firstName lastName specialization consultationFee');

    res.status(201).json({ message: 'Appointment created successfully', appointment: populatedAppointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Update appointment
 *     tags: [Appointments]
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('patient', 'firstName lastName patientId')
    .populate('doctor', 'firstName lastName specialization consultationFee');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({
      message: 'Appointment updated successfully',
      appointment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Cancel appointment
 *     tags: [Appointments]
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Free up the slot in the Slot collection if it exists
    try {
      const Slot = require('../models/Slot');
      const startOfDay = new Date(appointment.appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      await Slot.findOneAndUpdate(
        { doctor: appointment.doctor, date: startOfDay, time: appointment.appointmentTime },
        { status: 'available', appointment: null }
      );
    } catch (_) { /* Slot model optional */ }

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/appointments/:id/status — update status only (doctor use)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('patient', 'firstName lastName')
     .populate('doctor', 'firstName lastName specialization consultationFee');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/appointments/:id/permanent — permanently delete a cancelled appointment
router.delete('/:id/permanent', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status !== 'Cancelled') {
      return res.status(400).json({ message: 'Only cancelled appointments can be permanently deleted.' });
    }
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment permanently deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
