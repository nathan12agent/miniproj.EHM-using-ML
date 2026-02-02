const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

// Get all beds with optional filtering
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

    const beds = await Bed.find(query)
      .populate('patient', 'firstName lastName patientId dateOfBirth gender')
      .sort({ bedNumber: 1 });

    res.json({ beds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bed occupancy statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Bed.getOccupancyStats();
    
    // Calculate overall stats
    const overall = {
      total: 0,
      occupied: 0,
      available: 0,
      maintenance: 0
    };
    
    stats.forEach(stat => {
      overall.total += stat.total;
      overall.occupied += stat.occupied;
      overall.available += stat.available;
      overall.maintenance += stat.maintenance;
    });
    
    res.json({
      overall,
      byWard: stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single bed by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id)
      .populate('patient', 'firstName lastName patientId dateOfBirth gender phone');
    
    if (!bed) {
      return res.status(404).json({ message: 'Bed not found' });
    }

    res.json(bed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new bed
router.post('/', auth, [
  body('bedNumber').trim().notEmpty().withMessage('Bed number is required'),
  body('ward').isIn(['ICU', 'General', 'Emergency', 'Pediatric', 'Maternity']).withMessage('Invalid ward')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bed = new Bed({
      ...req.body,
      createdBy: req.user.id
    });

    await bed.save();

    res.status(201).json({
      message: 'Bed created successfully',
      bed
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bed number already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign bed to patient
router.post('/:id/assign', auth, [
  body('patientId').notEmpty().withMessage('Patient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({ message: 'Bed not found' });
    }

    if (bed.status === 'Occupied') {
      return res.status(400).json({ message: 'Bed is already occupied' });
    }

    if (bed.status === 'Maintenance') {
      return res.status(400).json({ message: 'Bed is under maintenance' });
    }

    const patient = await Patient.findById(req.body.patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await bed.assignToPatient(req.body.patientId, req.user.id);

    const updatedBed = await Bed.findById(bed._id)
      .populate('patient', 'firstName lastName patientId');

    res.json({
      message: 'Bed assigned successfully',
      bed: updatedBed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Discharge patient from bed
router.post('/:id/discharge', auth, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({ message: 'Bed not found' });
    }

    if (bed.status !== 'Occupied') {
      return res.status(400).json({ message: 'Bed is not occupied' });
    }

    const patientId = await bed.dischargePatient(req.user.id);

    res.json({
      message: 'Patient discharged successfully',
      bed,
      patientId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bed status
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({ message: 'Bed not found' });
    }

    if (status) {
      bed.status = status;
    }
    if (notes !== undefined) {
      bed.notes = notes;
    }
    bed.updatedBy = req.user.id;

    await bed.save();

    res.json({
      message: 'Bed updated successfully',
      bed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete bed
router.delete('/:id', auth, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({ message: 'Bed not found' });
    }

    if (bed.status === 'Occupied') {
      return res.status(400).json({ message: 'Cannot delete occupied bed' });
    }

    await bed.deleteOne();

    res.json({ message: 'Bed deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
