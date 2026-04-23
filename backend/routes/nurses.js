const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Nurse = require('../models/Nurse');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

/**
 * POST /api/nurses/smart-assign
 *
 * Injury-severity-aware staff assignment:
 *   - Minor   → outpatient only: assign nurse, NO bed required
 *   - Moderate / Severe / Critical → assign nurse AND bed
 *
 * Body: { patientId, injurySeverity, ward }
 */
router.post('/smart-assign', auth, [
  body('patientId').notEmpty().withMessage('patientId is required'),
  body('injurySeverity')
    .isIn(['Minor', 'Moderate', 'Severe', 'Critical'])
    .withMessage('injurySeverity must be Minor, Moderate, Severe, or Critical'),
  body('ward')
    .isIn(['ICU', 'General', 'Emergency', 'Pediatric', 'Maternity'])
    .withMessage('ward must be one of: ICU, General, Emergency, Pediatric, Maternity')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId, injurySeverity, ward } = req.body;
    const Bed    = require('../models/Bed');
    const Doctor = require('../models/Doctor');
    const { CONDITION_SPECIALTY_MAP } = require('../utils/medicalTriage');

    // ── Resolve patient by MongoDB _id OR patientId string ──────────────────
    let patient = null;
    if (/^[0-9a-fA-F]{24}$/.test(patientId)) {
      patient = await Patient.findById(patientId);
    }
    if (!patient) {
      patient = await Patient.findOne({ patientId });
    }
    if (!patient) {
      patient = await Patient.findOne({ firstName: { $regex: patientId, $options: 'i' } });
    }
    if (!patient) {
      return res.status(404).json({
        message: `Patient "${patientId}" not found. Use MongoDB _id or patientId like P00001001`
      });
    }

    const bedRequired = ['Moderate', 'Severe', 'Critical'].includes(injurySeverity);
    const patientName = `${patient.firstName} ${patient.lastName}`;

    // ── Bed assignment ───────────────────────────────────────────────────────
    let assignedBed = null;
    if (bedRequired) {
      const bedUpdate = {
        status: 'Occupied',
        occupantType: 'patient',
        patient: patient._id,
        assignedDate: new Date(),
        allocatedTo: {
          name: patientName,
          role: 'Patient',
          id: patient.patientId || patient._id.toString(),
          department: ward,
        },
      };

      // Try exact ward first, then any available patient bed
      assignedBed = await Bed.findOneAndUpdate(
        { ward: { $regex: ward, $options: 'i' }, status: 'Available', bedPurpose: 'patient_bed' },
        bedUpdate,
        { new: true }
      );
      if (!assignedBed) {
        assignedBed = await Bed.findOneAndUpdate(
          { status: 'Available', bedPurpose: 'patient_bed' },
          bedUpdate,
          { new: true }
        );
      }

      if (assignedBed) {
        await Patient.findByIdAndUpdate(patient._id, {
          ward: assignedBed.ward,
          status: 'Active',
        });
      }
    }

    // ── Nurse assignment — ward match with fallback to any available ─────────
    let assignedNurse = null;
    let nurses = await Nurse.find({ ward: { $regex: ward, $options: 'i' } }).populate('assignedPatients');
    if (nurses.length === 0) {
      nurses = await Nurse.find({ status: { $in: ['On Duty', 'Off Duty'] } }).populate('assignedPatients');
    }
    if (nurses.length > 0) {
      nurses.sort((a, b) => (a.assignedPatients?.length || 0) - (b.assignedPatients?.length || 0));
      const best = nurses[0];
      const load = best.assignedPatients?.length || 0;
      const max  = best.maxPatientLoad || 5;
      if (load < max) {
        await Nurse.findByIdAndUpdate(best._id, {
          $push: { assignedPatients: patient._id },
          status: 'On Duty',
        });
        assignedNurse = await Nurse.findById(best._id).populate('assignedPatients', 'firstName lastName patientId');
      }
    }

    // ── Doctor assignment — by condition specialty with fallbacks ────────────
    let assignedDoctor = null;
    const conditionKey  = patient.condition || 'Other';
    const conditionInfo = CONDITION_SPECIALTY_MAP[conditionKey] || CONDITION_SPECIALTY_MAP['Other'];
    const preferredSpec = conditionInfo.specialty;
    const fallbacks     = conditionInfo.fallbacks || [];

    let doctor = await Doctor.findOne({ specialization: { $regex: preferredSpec, $options: 'i' }, status: 'Active', isOccupied: { $ne: true } });
    if (!doctor) {
      for (const spec of fallbacks) {
        doctor = await Doctor.findOne({ specialization: { $regex: spec, $options: 'i' }, status: 'Active', isOccupied: { $ne: true } });
        if (doctor) break;
      }
    }
    if (!doctor) {
      doctor = await Doctor.findOne({ status: 'Active', isOccupied: { $ne: true } });
    }
    if (doctor) {
      await Doctor.findByIdAndUpdate(doctor._id, {
        isOccupied: true,
        currentAssignment: {
          patientId: patient._id,
          patientName,
          bed: assignedBed ? { bedNumber: assignedBed.bedNumber, ward: assignedBed.ward } : null,
        },
      });
      await Patient.findByIdAndUpdate(patient._id, { assignedDoctor: doctor._id, injurySeverity });
      assignedDoctor = doctor;
    } else {
      await Patient.findByIdAndUpdate(patient._id, { injurySeverity });
    }

    return res.json({
      success: true,
      bedRequired,
      injurySeverity,
      message: bedRequired
        ? `Patient admitted. Bed ${assignedBed?.bedNumber || 'unavailable'} assigned in ${assignedBed?.ward || ward}.`
        : `Minor injury — outpatient care only. No bed required. Nurse assigned in ${ward} ward.`,
      assignedBed,
      assignedNurse,
      assignedDoctor,
      patient: { _id: patient._id, patientId: patient.patientId, name: patientName },
      wardInfo: {
        ward,
        bedAssignmentAdvised: bedRequired,
        careType: bedRequired ? 'Inpatient' : 'Outpatient',
      },
    });
  } catch (err) {
    console.error('=== SMART ASSIGN ERROR ===');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('==========================');
    res.status(500).json({
      message: err.message || 'Smart assign failed',
      detail: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });
  }
});

// Get all nurses with optional filtering
router.get('/', auth, async (req, res) => {
  try {
    const { ward, status } = req.query;
    
    let query = {};
    if (ward && ward !== 'All') {
      query.ward = ward;
    }
    if (status) {
      query.status = status;
    }

    const nurses = await Nurse.find(query)
      .populate('assignedPatients', 'firstName lastName patientId')
      .sort({ lastName: 1 });

    res.json({ nurses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single nurse by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const nurse = await Nurse.findById(req.params.id)
      .populate('assignedPatients', 'firstName lastName patientId dateOfBirth gender');
    
    if (!nurse) {
      return res.status(404).json({ message: 'Nurse not found' });
    }

    res.json(nurse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new nurse
router.post('/', auth, [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('phone').isMobilePhone().withMessage('Invalid phone number'),
  body('ward').isIn(['ICU', 'General', 'Emergency', 'Pediatric', 'Maternity']).withMessage('Invalid ward')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const nurse = new Nurse({
      ...req.body,
      createdBy: req.user.id
    });

    await nurse.save();

    res.status(201).json({
      message: 'Nurse created successfully',
      nurse
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Nurse with this email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update nurse
router.put('/:id', auth, async (req, res) => {
  try {
    const nurse = await Nurse.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate('assignedPatients', 'firstName lastName patientId');

    if (!nurse) {
      return res.status(404).json({ message: 'Nurse not found' });
    }

    res.json({
      message: 'Nurse updated successfully',
      nurse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign patient to nurse
router.post('/:id/assign-patient', auth, [
  body('patientId').notEmpty().withMessage('Patient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const nurse = await Nurse.findById(req.params.id);
    if (!nurse) {
      return res.status(404).json({ message: 'Nurse not found' });
    }

    await nurse.assignPatient(req.body.patientId);

    const updatedNurse = await Nurse.findById(nurse._id)
      .populate('assignedPatients', 'firstName lastName patientId');

    res.json({
      message: 'Patient assigned to nurse successfully',
      nurse: updatedNurse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove patient from nurse
router.post('/:id/remove-patient', auth, [
  body('patientId').notEmpty().withMessage('Patient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const nurse = await Nurse.findById(req.params.id);
    if (!nurse) {
      return res.status(404).json({ message: 'Nurse not found' });
    }

    await nurse.removePatient(req.body.patientId);

    const updatedNurse = await Nurse.findById(nurse._id)
      .populate('assignedPatients', 'firstName lastName patientId');

    res.json({
      message: 'Patient removed from nurse successfully',
      nurse: updatedNurse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete nurse
router.delete('/:id', auth, async (req, res) => {
  try {
    const nurse = await Nurse.findById(req.params.id);
    if (!nurse) return res.status(404).json({ message: 'Nurse not found' });
    if (nurse.isSeeded) return res.status(403).json({ message: 'Cannot delete seeded demo records' });
    if (nurse.assignedPatients && nurse.assignedPatients.length > 0) {
      return res.status(400).json({ message: 'Cannot delete nurse with assigned patients' });
    }

    await nurse.deleteOne();
    res.json({ message: 'Nurse deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
