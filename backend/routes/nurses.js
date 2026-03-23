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
 *   - Moderate / Severe / Critical → assign nurse AND flag bed required
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

    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Determine whether a bed is needed based on injury severity
    const bedRequired = ['Moderate', 'Severe', 'Critical'].includes(injurySeverity);

    // For Minor injuries, any available nurse in the ward works (not just On Duty)
    // For serious injuries, prioritise using the best available on-duty nurse
    let assignedNurse = null;
    if (!bedRequired) {
      // Minor injury — assign lightest-loaded nurse, any status
      const nurses = await Nurse.find({ ward })
        .populate('assignedPatients');

      const available = nurses
        .filter(n => n.assignedPatients.length < n.maxPatientLoad)
        .map(n => ({ nurse: n, score: n.getAvailabilityScore() }))
        .sort((a, b) => b.score - a.score);

      if (available.length > 0) {
        assignedNurse = available[0].nurse;
        await assignedNurse.assignPatient(patientId);
      }
    } else {
      // Moderate/Severe/Critical — use on-duty nurse via existing smart logic
      assignedNurse = await Nurse.findBestNurseForAssignment(ward);
      if (assignedNurse) {
        await assignedNurse.assignPatient(patientId);
      }
    }

    // Update the patient's injurySeverity field to keep it in sync
    await Patient.findByIdAndUpdate(patientId, { injurySeverity });

    const populatedNurse = assignedNurse
      ? await Nurse.findById(assignedNurse._id).populate('assignedPatients', 'firstName lastName patientId')
      : null;

    return res.json({
      bedRequired,
      injurySeverity,
      message: bedRequired
        ? `Patient requires a bed. Nurse assigned in ${ward} ward.`
        : `Minor injury — outpatient care only. No bed required. Nurse assigned in ${ward} ward.`,
      assignedNurse: populatedNurse,
      wardInfo: {
        ward,
        bedAssignmentAdvised: bedRequired,
        careType: bedRequired ? 'Inpatient' : 'Outpatient'
      }
    });
  } catch (error) {
    console.error('Smart-assign error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
