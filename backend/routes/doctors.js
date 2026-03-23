const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 */
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, specialization, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { doctorId: { $regex: search, $options: 'i' } }
      ];
    }
    if (specialization) query.specialization = specialization;
    if (status) query.status = status;

    const doctors = await Doctor.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Doctor.countDocuments(query);

    res.json({
      doctors,
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
 * /api/doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/doctors:
 *   post:
 *     summary: Create new doctor
 *     tags: [Doctors]
 */
router.post('/', auth, [
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('specialization').notEmpty(),
  body('phone').isMobilePhone(),
  body('email').isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const doctor = new Doctor({
      ...req.body,
      createdBy: req.user.id
    });

    await doctor.save();

    res.status(201).json({
      message: 'Doctor created successfully',
      doctor
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Doctor with this email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/doctors/{id}:
 *   put:
 *     summary: Update doctor
 *     tags: [Doctors]
 */
router.put('/:id', auth, async (req, res) => {
  try {
    // Exclude access control fields from general updates
    const { mlAccess, chatAccess, ...safeBody } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: { ...safeBody, updatedBy: req.user.id } },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({
      message: 'Doctor updated successfully',
      doctor
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/doctors/{id}:
 *   delete:
 *     summary: Delete doctor
 *     tags: [Doctors]
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    if (doctor.isSeeded) return res.status(403).json({ message: 'Cannot delete seeded demo records' });

    await Doctor.findByIdAndUpdate(req.params.id, { status: 'Inactive' }, { new: true });
    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/doctors/:id/access — toggle mlAccess and/or chatAccess
router.patch('/:id/access', auth, async (req, res) => {
  try {
    const { mlAccess, chatAccess } = req.body;
    const update = {};
    if (mlAccess !== undefined) update.mlAccess = mlAccess;
    if (chatAccess !== undefined) update.chatAccess = chatAccess;

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ success: true, doctor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
