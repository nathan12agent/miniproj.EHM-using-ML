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

    const total = await Patient.countDocuments(query);

    res.json({
      patients,
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
      return res.status(400).json({ errors: errors.array() });
    }

    const patient = new Patient({
      ...req.body,
      createdBy: req.user.id
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
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Patient with this email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
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
      return res.status(400).json({ errors: errors.array() });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
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

    // Import models
    const Doctor = require('../models/Doctor');
    const Nurse = require('../models/Nurse');
    const Bed = require('../models/Bed');

    // Call ML service for disease prediction and specialist recommendation
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    
    let predictedDisease = req.body.disease || 'Unknown';
    let specialistType = 'General Practitioner';
    let department = 'General';
    let urgencyLevel = 'medium';
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
      // Continue with default values
    }

    // Find and assign doctor based on specialist type
    console.log('Finding doctor with specialization:', specialistType);
    let assignedDoctor = null;
    
    // Try exact match first
    let doctors = await Doctor.find({
      specialization: { $regex: new RegExp(specialistType, 'i') },
      status: 'Active'
    }).sort({ patientsAttended: 1 }).limit(5);
    
    console.log(`Found ${doctors.length} doctors with specialization matching "${specialistType}"`);
    
    if (doctors.length === 0) {
      // Try broader search
      console.log('No exact match, trying broader search...');
      doctors = await Doctor.find({ status: 'Active' }).sort({ patientsAttended: 1 }).limit(5);
      console.log(`Found ${doctors.length} doctors (any specialization)`);
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
    
    const targetWard = wardMapping[department] || 'General';
    console.log('Target ward:', targetWard);
    
    let assignedNurse = null;
    let nurses = await Nurse.find({
      ward: targetWard,
      status: 'On Duty'
    }).limit(5);
    
    console.log(`Found ${nurses.length} nurses in ${targetWard} ward`);
    
    if (nurses.length === 0) {
      // Try any ward
      console.log('No nurses in target ward, trying any ward...');
      nurses = await Nurse.find({ status: 'On Duty' }).limit(5);
      console.log(`Found ${nurses.length} nurses (any ward)`);
    }
    
    if (nurses.length > 0) {
      // Pick nurse with least patients
      assignedNurse = nurses[0];
      console.log('Assigned nurse:', assignedNurse.firstName, assignedNurse.lastName, '-', assignedNurse.ward);
    } else {
      console.log('WARNING: No nurses found in database!');
    }
    
    // Find available bed in the assigned ward
    console.log('Finding available bed in ward:', targetWard);
    let assignedBed = null;
    let availableBeds = await Bed.find({
      status: 'Available',
      ward: targetWard
    }).limit(1);
    
    console.log(`Found ${availableBeds.length} available beds in ${targetWard} ward`);
    
    if (availableBeds.length === 0) {
      // Try any ward
      console.log('No beds in target ward, trying any ward...');
      availableBeds = await Bed.find({ status: 'Available' }).limit(1);
      console.log(`Found ${availableBeds.length} available beds (any ward)`);
    }
    
    if (availableBeds.length > 0) {
      assignedBed = availableBeds[0];
      console.log('Assigned bed:', assignedBed.bedNumber, '-', assignedBed.ward);
      
      // Update bed status
      assignedBed.status = 'Occupied';
      assignedBed.patient = patient._id;
      assignedBed.assignedDate = new Date();
      await assignedBed.save();
      console.log('Bed status updated to Occupied');
    } else {
      console.log('WARNING: No available beds found in database!');
    }
    
    // Update patient with assignments
    console.log('Updating patient record...');
    patient.assignedDoctor = assignedDoctor ? assignedDoctor._id : null;
    patient.autoAssignment = {
      isAutoAssigned: true,
      predictedDisease: predictedDisease,
      diseaseConfidence: confidence,
      assignedDepartment: department,
      assignedSpecialistType: specialistType,
      urgencyLevel: urgencyLevel,
      assignedDoctor: assignedDoctor ? assignedDoctor._id : null,
      assignedNurse: assignedNurse ? assignedNurse._id : null,
      assignedBed: assignedBed ? assignedBed._id : null,
      doctorConfidence: 0.95,
      nurseConfidence: 0.90,
      assignmentTimestamp: new Date(),
      assignmentMethod: 'ml_auto'
    };
    
    await patient.save();
    console.log('Patient record updated');
    
    // Assign patient to nurse
    if (assignedNurse && patient._id) {
      console.log('Adding patient to nurse assignment list...');
      if (!assignedNurse.assignedPatients) {
        assignedNurse.assignedPatients = [];
      }
      if (!assignedNurse.assignedPatients.includes(patient._id)) {
        assignedNurse.assignedPatients.push(patient._id);
        await assignedNurse.save();
        console.log('Nurse assignment list updated');
      }
    }
    
    // Populate the response
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
        department: department,
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