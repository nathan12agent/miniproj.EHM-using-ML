const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const axios = require('axios');

/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - dateOfBirth
 *         - gender
 *         - phone
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         bloodGroup:
 *           type: string
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 */

// Validation middleware
const validatePatient = [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('phone').isMobilePhone().withMessage('Invalid phone number'),
  body('email').optional().isEmail().withMessage('Invalid email address')
];

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Get all patients
 *     tags: [Patients]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of patients per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or patient ID
 *     responses:
 *       200:
 *         description: List of patients
 */
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const patients = await Patient.find(query)
      .select('-medicalHistory -allergies -currentMedications')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Compute active bed assignments
    const Bed = require('../models/Bed');
    const allBeds = await Bed.find({ status: 'Occupied' });
    const bedMap = {};
    allBeds.forEach(bed => {
      if (bed.patient) {
         bedMap[bed.patient.toString()] = { bedNumber: bed.bedNumber, ward: bed.ward };
      }
    });

    const patientsWithBeds = patients.map(p => {
      const obj = p.toObject();
      if (bedMap[p._id.toString()]) {
         obj.assignedBed = bedMap[p._id.toString()];
      }
      return obj;
    });

    const total = await Patient.countDocuments(query);

    res.json({
      patients: patientsWithBeds,
      pagination: {
        current: page,
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
 * /api/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient details
 *       404:
 *         description: Patient not found
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Create new patient
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', auth, validatePatient, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { CONDITION_SPECIALTY_MAP } = require('../utils/medicalTriage');
    const triage = CONDITION_SPECIALTY_MAP[req.body.condition || 'Other'];

    const cleanBody = { ...req.body };
    Object.keys(cleanBody).forEach(key => {
      if (cleanBody[key] === '') delete cleanBody[key];
    });

    const patient = new Patient({
      ...cleanBody,
      createdBy: req.user.id,
      injurySeverity: triage?.severity || 'Minor'
    });

    await patient.save();

    // Calculate initial risk scores using ML service
    try {
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict/risk`, {
        patientData: {
          age: patient.age,
          gender: patient.gender,
          medicalHistory: patient.medicalHistory,
          allergies: patient.allergies
        }
      });

      if (mlResponse.data.success) {
        await patient.updateRiskScores(mlResponse.data.riskScores);
      }
    } catch (mlError) {
      console.warn('ML service unavailable for risk calculation:', mlError.message);
    }

    res.status(201).json({
      message: 'Patient created successfully',
      patient: {
        id: patient._id,
        patientId: patient.patientId,
        fullName: patient.fullName
      }
    });
  } catch (error) {
    console.error("PATIENT CREATE ERROR:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate field error: ' + JSON.stringify(error.keyValue) });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Update patient
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       404:
 *         description: Patient not found
 */
router.put('/:id', auth, validatePatient, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { CONDITION_SPECIALTY_MAP } = require('../utils/medicalTriage');
    const triage = CONDITION_SPECIALTY_MAP[req.body.condition || 'Other'];

    const cleanBody = { ...req.body };
    Object.keys(cleanBody).forEach(key => {
      if (cleanBody[key] === '') delete cleanBody[key];
    });

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { ...cleanBody, updatedBy: req.user.id, injurySeverity: triage?.severity || 'Minor' },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Recalculate risk scores if medical data changed
    if (req.body.medicalHistory || req.body.allergies || req.body.currentMedications) {
      try {
        const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict/risk`, {
          patientData: {
            age: patient.age,
            gender: patient.gender,
            medicalHistory: patient.medicalHistory,
            allergies: patient.allergies,
            currentMedications: patient.currentMedications
          }
        });

        if (mlResponse.data.success) {
          await patient.updateRiskScores(mlResponse.data.riskScores);
        }
      } catch (mlError) {
        console.warn('ML service unavailable for risk recalculation:', mlError.message);
      }
    }

    res.json({
      message: 'Patient updated successfully',
      patient
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     summary: Delete patient (soft delete)
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *       404:
 *         description: Patient not found
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { status: 'Inactive', updatedBy: req.user.id },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/patients/high-risk:
 *   get:
 *     summary: Get high-risk patients
 *     tags: [Patients]
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *         description: Risk threshold (0-1)
 *     responses:
 *       200:
 *         description: List of high-risk patients
 */
router.get('/high-risk', auth, async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 0.7;
    const highRiskPatients = await Patient.findHighRiskPatients(threshold)
      .select('patientId firstName lastName riskScores')
      .sort({ 'riskScores.mortalityRisk': -1 });

    res.json(highRiskPatients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign doctor to patient
router.post('/:id/assign-doctor', auth, async (req, res) => {
  try {
    const { doctorId } = req.body;
    
    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { assignedDoctor: doctorId, updatedBy: req.user.id },
      { new: true }
    ).populate('assignedDoctor', 'firstName lastName specialization');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({
      message: 'Doctor assigned successfully',
      patient
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto assign doctor and bed based on injury severity
router.post('/:id/auto-assign', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    
    const { CONDITION_SPECIALTY_MAP } = require('../utils/medicalTriage');
    const triage = CONDITION_SPECIALTY_MAP[patient.condition || 'Other'] || { specialty: 'General Medicine', severity: 'Minor' };
    
    // Auto-update injurySeverity to ensure perfectly aligned assignments
    if (patient.injurySeverity !== triage.severity) {
      patient.injurySeverity = triage.severity;
    }

    // 1. Assign available active Doctor with matching specialty
    const Doctor = require('../models/Doctor');
    let doctors = await Doctor.find({ status: 'Active', specialization: triage.specialty });

    // 2. Try semantic fallbacks sequentially if the primary specialist is missing
    if (doctors.length === 0 && triage.fallbacks && triage.fallbacks.length > 0) {
      for (const fallback of triage.fallbacks) {
        doctors = await Doctor.find({ status: 'Active', specialization: fallback });
        if (doctors.length > 0) break;
      }
    }
    
    // 3. Fallback to General Medicine if a specialist/fallback is still unavailable
    if (doctors.length === 0 && triage.specialty !== 'General Medicine') {
       doctors = await Doctor.find({ status: 'Active', specialization: 'General Medicine' });
    }

    // 4. Fallback to any active doctor if General Medicine is ALSO unavailable
    if (doctors.length === 0) {
       doctors = await Doctor.find({ status: 'Active' });
    }
    
    if (doctors.length === 0) return res.status(400).json({ message: 'No active doctors available' });
    const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
    patient.assignedDoctor = randomDoctor._id;
    await patient.save();

    // 2. Assign bed if severity is not Minor
    if (triage.severity === 'Minor') {
      return res.json({ 
        message: `Condition: ${patient.condition}. Dr. ${randomDoctor.lastName} (${randomDoctor.specialization}) assigned. Outpatient care - no bed required.` 
      });
    }

    // Assign bed logic for Moderate, Severe, Critical
    let targetWard = 'General';
    if (triage.severity === 'Severe' || triage.severity === 'Critical') targetWard = 'ICU';

    const Bed = require('../models/Bed');
    // Find an available bed in the target ward
    let bed = await Bed.findOne({ ward: targetWard, status: 'Available' });
    
    // Fallback to any available bed if target ward is full
    if (!bed) bed = await Bed.findOne({ status: 'Available' });

    if (!bed) {
      return res.json({
        message: `Assigned Dr. ${randomDoctor.lastName}, but no beds are currently available!`
      });
    }

    await bed.assignToPatient(patient._id, req.user.id);
    return res.json({
      message: `${patient.injurySeverity} injury. Assigned Dr. ${randomDoctor.lastName} and Bed ${bed.bedNumber} (${bed.ward}).`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;