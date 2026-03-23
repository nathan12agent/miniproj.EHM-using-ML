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
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    if (patient.isSeeded) return res.status(403).json({ message: 'Cannot delete seeded demo records' });

    await Patient.findByIdAndUpdate(req.params.id, { status: 'Inactive', updatedBy: req.user.id }, { new: true });
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

/**
 * Auto-assign doctor, nurse, and bed using ML service
 * Also updates injurySeverity from CONDITION_SPECIALTY_MAP for triage alignment
 */
router.post('/:id/auto-assign', auth, async (req, res) => {
  try {
    console.log('=== AUTO-ASSIGNMENT STARTED ===');
    console.log('Patient ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      console.log('ERROR: Patient not found');
      return res.status(404).json({ message: 'Patient not found' });
    }

    console.log('Patient found:', patient.firstName, patient.lastName);

    // Sync injurySeverity from condition triage map
    const { CONDITION_SPECIALTY_MAP } = require('../utils/medicalTriage');
    const triage = CONDITION_SPECIALTY_MAP[patient.condition || 'Other'];
    if (triage && patient.injurySeverity !== triage.severity) {
      patient.injurySeverity = triage.severity;
    }

    // Import models
    const Doctor = require('../models/Doctor');
    const Nurse = require('../models/Nurse');
    const Bed = require('../models/Bed');

    // Call ML service for disease prediction and specialist recommendation
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    
    let predictedDisease = req.body.disease || 'Unknown';
    let specialistType = triage?.specialty || 'General Practitioner';
    let department = 'General';
    let urgencyLevel = triage?.severity?.toLowerCase() || 'medium';
    let confidence = 0.5;

    try {
      console.log('Calling ML service...');
      const mlResponse = await axios.post(`${mlServiceUrl}/auto_admit_and_assign`, {
        patient_info: {
          id: patient._id.toString(),
          name: `${patient.firstName} ${patient.lastName}`,
          age: patient.age || 30
        },
        prediction_type: req.body.prediction_type || 'symptoms',
        symptoms: req.body.symptoms || {},
        disease: req.body.disease
      }, { timeout: 10000 });

      console.log('ML service response:', JSON.stringify(mlResponse.data, null, 2));

      if (mlResponse.data.success && mlResponse.data.admission_summary) {
        const summary = mlResponse.data.admission_summary;
        predictedDisease = summary.predicted_disease || predictedDisease;
        specialistType = summary.specialist_type || specialistType;
        department = summary.department || department;
        urgencyLevel = summary.urgency_level || urgencyLevel;
        confidence = summary.confidence || confidence;
        console.log('ML predictions:', { predictedDisease, specialistType, department, urgencyLevel });
      }
    } catch (mlError) {
      console.log('ML service error (continuing with defaults):', mlError.message);
    }

    // Find and assign doctor based on specialist type
    console.log('Finding doctor with specialization:', specialistType);
    let assignedDoctor = null;
    
    let doctors = await Doctor.find({
      specialization: { $regex: new RegExp(specialistType, 'i') },
      status: 'Active'
    }).sort({ patientsAttended: 1 }).limit(5);
    
    if (doctors.length === 0) {
      // Try triage fallbacks
      if (triage?.fallbacks) {
        for (const fallback of triage.fallbacks) {
          doctors = await Doctor.find({ status: 'Active', specialization: fallback });
          if (doctors.length > 0) break;
        }
      }
    }

    if (doctors.length === 0) {
      doctors = await Doctor.find({ status: 'Active', specialization: 'General Medicine' });
    }

    if (doctors.length === 0) {
      doctors = await Doctor.find({ status: 'Active' }).sort({ patientsAttended: 1 }).limit(5);
    }
    
    if (doctors.length > 0) {
      assignedDoctor = doctors[0];
      console.log('Assigned doctor:', assignedDoctor.firstName, assignedDoctor.lastName, '-', assignedDoctor.specialization);
    } else {
      console.log('WARNING: No doctors found in database!');
    }
    
    // Find and assign nurse based on ward
    const wardMapping = {
      'Cardiology': 'ICU',
      'Neurology': 'ICU',
      'Emergency': 'Emergency',
      'Pulmonology': 'General',
      'Gastroenterology': 'General',
      'Endocrinology': 'General',
      'Dermatology': 'General',
      'Nephrology': 'General',
      'Rheumatology': 'General',
      'Orthopedics': 'General',
      'Infectious Disease': 'ICU',
      'General': 'General'
    };
    
    const targetWard = wardMapping[department] || (
      patient.injurySeverity === 'Severe' || patient.injurySeverity === 'Critical' ? 'ICU' : 'General'
    );
    console.log('Target ward:', targetWard);
    
    let assignedNurse = null;
    let nurses = await Nurse.find({ ward: targetWard, status: 'On Duty' }).limit(5);
    
    if (nurses.length === 0) {
      nurses = await Nurse.find({ status: 'On Duty' }).limit(5);
    }
    
    if (nurses.length > 0) {
      assignedNurse = nurses[0];
      console.log('Assigned nurse:', assignedNurse.firstName, assignedNurse.lastName, '-', assignedNurse.ward);
    } else {
      console.log('WARNING: No nurses found in database!');
    }
    
    // Find available bed — skip for Minor injuries (outpatient)
    let assignedBed = null;
    if (patient.injurySeverity !== 'Minor') {
      let availableBeds = await Bed.find({ status: 'Available', ward: targetWard }).limit(1);
      if (availableBeds.length === 0) {
        availableBeds = await Bed.find({ status: 'Available' }).limit(1);
      }
      
      if (availableBeds.length > 0) {
        assignedBed = availableBeds[0];
        console.log('Assigned bed:', assignedBed.bedNumber, '-', assignedBed.ward);
        assignedBed.status = 'Occupied';
        assignedBed.patient = patient._id;
        assignedBed.assignedDate = new Date();
        await assignedBed.save();
      } else {
        console.log('WARNING: No available beds found in database!');
      }
    } else {
      console.log('Minor injury — outpatient care, no bed assigned');
    }
    
    // Update patient with assignments
    patient.assignedDoctor = assignedDoctor ? assignedDoctor._id : null;
    patient.autoAssignment = {
      isAutoAssigned: true,
      predictedDisease,
      diseaseConfidence: confidence,
      assignedDepartment: department,
      assignedSpecialistType: specialistType,
      urgencyLevel,
      assignedDoctor: assignedDoctor ? assignedDoctor._id : null,
      assignedNurse: assignedNurse ? assignedNurse._id : null,
      assignedBed: assignedBed ? assignedBed._id : null,
      doctorConfidence: 0.95,
      nurseConfidence: 0.90,
      assignmentTimestamp: new Date(),
      assignmentMethod: 'ml_auto'
    };
    
    await patient.save();
    
    // Assign patient to nurse
    if (assignedNurse && patient._id) {
      if (!assignedNurse.assignedPatients) assignedNurse.assignedPatients = [];
      if (!assignedNurse.assignedPatients.includes(patient._id)) {
        assignedNurse.assignedPatients.push(patient._id);
        await assignedNurse.save();
      }
    }
    
    if (assignedDoctor) {
      await patient.populate('assignedDoctor', 'firstName lastName specialization');
    }
    
    console.log('=== AUTO-ASSIGNMENT COMPLETED SUCCESSFULLY ===');
    
    res.json({
      success: true,
      message: 'Auto-assignment completed successfully',
      patient,
      assignments: {
        doctor: assignedDoctor ? {
          id: assignedDoctor._id,
          name: `${assignedDoctor.firstName} ${assignedDoctor.lastName}`,
          specialization: assignedDoctor.specialization,
          confidence: 0.95
        } : null,
        nurse: assignedNurse ? {
          id: assignedNurse._id,
          name: `${assignedNurse.firstName} ${assignedNurse.lastName}`,
          ward: assignedNurse.ward,
          confidence: 0.90
        } : null,
        bed: assignedBed ? {
          id: assignedBed._id,
          bedNumber: assignedBed.bedNumber,
          ward: assignedBed.ward
        } : null,
        disease: predictedDisease,
        department,
        urgency: urgencyLevel
      }
    });
  } catch (error) {
    console.error('=== AUTO-ASSIGNMENT ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during auto-assignment',
      error: error.message
    });
  }
});

module.exports = router;