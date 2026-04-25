const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/auth/doctor/login:
 *   post:
 *     summary: Doctor login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Doctor login successful
 */
router.post('/doctor/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Find user with Doctor role
    const user = await User.findOne({ email, role: 'Doctor' });
    if (!user) {
      return res.status(401).json({ message: 'Invalid doctor credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid doctor credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Doctor account is inactive' });
    }

    // Get doctor profile
    const Doctor = require('../models/Doctor');
    const doctorProfile = await Doctor.findOne({ userId: user._id });
    if (!doctorProfile) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, doctorId: doctorProfile._id },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorProfile: {
          id: doctorProfile._id,
          fullName: doctorProfile.fullName,
          specialization: doctorProfile.specialization,
          mlAccess: doctorProfile.mlAccess,
          mlStats: doctorProfile.mlStats
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 */
router.post('/register', auth, [
  body('name').trim().isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User(req.body);
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 */
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// POST /api/auth/nurse/login
router.post('/nurse/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'Nurse' });
    if (!user) return res.status(401).json({ message: 'Invalid nurse credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid nurse credentials' });
    if (!user.isActive) return res.status(403).json({ message: 'Nurse account is inactive' });

    const Nurse = require('../models/Nurse');
    let nurseProfile = await Nurse.findOne({ userId: user._id })
      .populate('assignedPatients', 'firstName lastName patientId');
    // Fallback: find by email if userId not linked yet
    if (!nurseProfile) {
      nurseProfile = await Nurse.findOne({ email: user.email })
        .populate('assignedPatients', 'firstName lastName patientId');
      if (nurseProfile) {
        nurseProfile.userId = user._id;
        await nurseProfile.save();
      }
    }
    if (!nurseProfile) return res.status(404).json({ message: 'Nurse profile not found' });

    const token = jwt.sign(
      { id: user._id, role: user.role, nurseId: nurseProfile._id },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        nurseProfile: {
          id: nurseProfile._id, nurseId: nurseProfile.nurseId,
          firstName: nurseProfile.firstName, lastName: nurseProfile.lastName,
          ward: nurseProfile.ward, shift: nurseProfile.shift,
          status: nurseProfile.status, experience: nurseProfile.experience,
          assignedPatients: nurseProfile.assignedPatients
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/nurse/register (public self-registration)
router.post('/nurse/register', [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('ward').isIn(['ICU', 'General', 'Emergency', 'Pediatric', 'Maternity']).withMessage('Valid ward is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { firstName, lastName, email, password, phone, ward, shift, specialization, experience } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'An account with this email already exists' });

    const user = new User({ name: `${firstName} ${lastName}`, email, password, role: 'Nurse', phone });
    await user.save();

    const Nurse = require('../models/Nurse');
    const nurse = new Nurse({
      firstName, lastName, email, phone,
      ward: ward || 'General', shift: shift || 'Morning',
      status: 'Off Duty', specialization: specialization || '',
      experience: experience || 0, userId: user._id
    });
    await nurse.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, nurseId: nurse._id },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'Nurse registered successfully', token,
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        nurseProfile: {
          id: nurse._id, nurseId: nurse.nurseId,
          firstName: nurse.firstName, lastName: nurse.lastName,
          ward: nurse.ward, shift: nurse.shift, status: nurse.status
        }
      }
    });
  } catch (error) {
    console.error('Nurse registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
