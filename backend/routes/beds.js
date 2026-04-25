const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Nurse = require('../models/Nurse');
const auth = require('../middleware/auth');

// Get all beds with optional filtering
router.get('/', auth, async (req, res) => {
  try {
    const { ward, status, purpose } = req.query;

    let query = {};
    if (ward && ward !== 'All') query.ward = ward;
    if (status) query.status = status;
    if (purpose) query.bedPurpose = purpose;

    const beds = await Bed.find(query)
      .populate({
        path: 'patient',
        select: 'firstName lastName patientId dateOfBirth gender phone condition assignedDoctor',
        populate: { path: 'assignedDoctor', select: 'firstName lastName specialization' }
      })
      .sort({ bedPurpose: 1, ward: 1, bedNumber: 1 });

    // Attach assignedNurse to each occupied patient bed
    const bedsWithNurse = await Promise.all(beds.map(async (bed) => {
      const bedObj = bed.toObject ? bed.toObject() : bed;
      if (bedObj.patient?._id) {
        const nurse = await Nurse.findOne({ assignedPatients: bedObj.patient._id })
          .select('firstName lastName email phone specialization');
        if (bedObj.patient) bedObj.patient.assignedNurse = nurse || null;
      }
      return bedObj;
    }));

    const patientBeds   = bedsWithNurse.filter(b => b.bedPurpose === 'patient_bed');
    const doctorRooms   = bedsWithNurse.filter(b => b.bedPurpose === 'doctor_room');
    const nurseStations = bedsWithNurse.filter(b => b.bedPurpose === 'nurse_station');

    res.json({
      beds: bedsWithNurse,
      breakdown: {
        patientBeds:   { total: patientBeds.length,   available: patientBeds.filter(b => b.status === 'Available').length },
        doctorRooms:   { total: doctorRooms.length,   available: doctorRooms.filter(b => b.status === 'Available').length },
        nurseStations: { total: nurseStations.length, available: nurseStations.filter(b => b.status === 'Available').length },
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bed occupancy statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Bed.getOccupancyStats();

    const overall = { total: 0, occupied: 0, available: 0, maintenance: 0 };
    stats.forEach(stat => {
      overall.total      += stat.total;
      overall.occupied   += stat.occupied;
      overall.available  += stat.available;
      overall.maintenance += stat.maintenance;
    });

    res.json({ overall, byWard: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single bed by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id)
      .populate({
        path: 'patient',
        select: 'firstName lastName patientId dateOfBirth gender phone condition assignedDoctor',
        populate: { path: 'assignedDoctor', select: 'firstName lastName specialization' }
      });

    if (!bed) return res.status(404).json({ message: 'Bed not found' });
    res.json(bed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new bed
router.post('/', auth, [
  body('bedNumber').trim().notEmpty().withMessage('Bed number is required'),
  body('ward').isIn(['General', 'ICU', 'Emergency', 'Pediatric', 'Maternity', 'Doctor Wing', 'Nurse Station']).withMessage('Invalid ward')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const bed = new Bed({ ...req.body, createdBy: req.user.id });
    await bed.save();

    res.status(201).json({ message: 'Bed created successfully', bed });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) return res.status(400).json({ message: 'Bed number already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign bed to patient
router.post('/:id/assign', auth, [
  body('patientId').notEmpty().withMessage('Patient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const bed = await Bed.findById(req.params.id);
    if (!bed) return res.status(404).json({ message: 'Bed not found' });
    if (bed.status === 'Occupied') return res.status(400).json({ message: 'Bed is already occupied' });
    if (bed.status === 'Maintenance') return res.status(400).json({ message: 'Bed is under maintenance' });

    const patient = await Patient.findById(req.body.patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (patient.injurySeverity === 'Minor') {
      return res.status(400).json({ message: 'Patient has a minor injury and does not require a bed (outpatient care only).' });
    }

    await bed.assignPatient(patient._id, req.user.id);

    const updatedBed = await Bed.findById(bed._id)
      .populate({
        path: 'patient',
        select: 'firstName lastName patientId dateOfBirth gender phone condition assignedDoctor',
        populate: { path: 'assignedDoctor', select: 'firstName lastName specialization' }
      });

    res.json({ message: 'Bed assigned successfully', bed: updatedBed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Discharge patient from bed
router.post('/:id/discharge', auth, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) return res.status(404).json({ message: 'Bed not found' });
    if (bed.status !== 'Occupied') return res.status(400).json({ message: 'Bed is not occupied' });

    const patientId = await bed.dischargePatient(req.user.id);
    res.json({ message: 'Patient discharged successfully', bed, patientId });
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
    if (!bed) return res.status(404).json({ message: 'Bed not found' });

    if (status) bed.status = status;
    if (notes !== undefined) bed.notes = notes;
    bed.updatedBy = req.user.id;

    await bed.save();
    res.json({ message: 'Bed updated successfully', bed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete bed
router.delete('/:id', auth, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) return res.status(404).json({ message: 'Bed not found' });
    if (bed.isSeeded) return res.status(403).json({ message: 'Cannot delete seeded demo records' });
    if (bed.status === 'Occupied') return res.status(400).json({ message: 'Cannot delete occupied bed' });

    await bed.deleteOne();
    res.json({ message: 'Bed deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/beds/auto-allocate/patients
router.post('/auto-allocate/patients', auth, async (req, res) => {
  try {
    const occupiedBeds = await Bed.find({ bedPurpose: 'patient_bed', status: 'Occupied', patient: { $ne: null } }).select('patient');
    const assignedPatientIds = occupiedBeds.map(b => b.patient?.toString()).filter(Boolean);

    const unassignedPatients = await Patient.find({
      status: 'Active',
      _id: { $nin: assignedPatientIds },
    }).limit(50);

    if (unassignedPatients.length === 0) {
      return res.json({ success: true, summary: 'All active patients already have beds assigned', allocated: 0, skipped: 0, failed: 0, results: [] });
    }

    const results = [];
    for (const patient of unassignedPatients) {
      const name = `${patient.firstName} ${patient.lastName}`;

      const bed = await Bed.findOneAndUpdate(
        { bedPurpose: 'patient_bed', status: 'Available' },
        {
          status: 'Occupied',
          occupantType: 'patient',
          patient: patient._id,
          assignedDate: new Date(),
          allocatedTo: { name, role: 'Patient', id: patient.patientId, department: '' },
        },
        { new: true }
      );

      if (bed) {
        results.push({ patient: name, patientId: patient.patientId, status: 'allocated', bed: bed.bedNumber, ward: bed.ward });
      } else {
        results.push({ patient: name, patientId: patient.patientId, status: 'no_bed_available', bed: null, ward: null });
      }
    }

    const allocated = results.filter(r => r.status === 'allocated').length;
    const failed    = results.filter(r => r.status === 'no_bed_available').length;

    res.json({ success: true, summary: `${allocated} patients allocated to beds, ${failed} could not be assigned`, allocated, skipped: 0, failed, results });
  } catch (err) {
    console.error('Patient auto-allocate error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/beds/release/single
router.post('/release/single', auth, async (req, res) => {
  try {
    const { bedId } = req.body;
    if (!bedId) return res.status(400).json({ message: 'bedId is required' });

    const bed = await Bed.findById(bedId);
    if (!bed) return res.status(404).json({ message: 'Bed not found' });
    if (bed.status !== 'Occupied') return res.status(400).json({ message: 'Bed is not occupied' });

    const occupantName = bed.allocatedTo?.name || (bed.patient ? 'Patient' : 'Unknown');
    const occupantType = bed.occupantType;

    await Bed.findByIdAndUpdate(bedId, {
      status: 'Available',
      occupantType: 'unoccupied',
      patient: null,
      assignedDate: null,
      allocatedTo: { name: null, role: null, id: null, department: null },
    });

    res.json({ success: true, message: `${occupantName} released from ${bed.bedNumber}`, bedNumber: bed.bedNumber, occupantType, occupantName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/beds/auto-allocate/doctors
router.post('/auto-allocate/doctors', auth, async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: 'Active' });
    const results = [];

    for (const doctor of doctors) {
      const name = `Dr. ${doctor.firstName} ${doctor.lastName}`;

      const existing = await Bed.findOne({ bedPurpose: 'doctor_room', 'allocatedTo.id': doctor._id.toString() });
      if (existing) {
        results.push({ doctor: name, status: 'already_allocated', room: existing.bedNumber });
        continue;
      }

      const bed = await Bed.findOneAndUpdate(
        { bedPurpose: 'doctor_room', status: 'Available' },
        { status: 'Occupied', occupantType: 'doctor', assignedDate: new Date(), allocatedTo: { name, role: 'Doctor', id: doctor._id.toString(), department: doctor.specialization || '' } },
        { new: true }
      );

      if (bed) {
        results.push({ doctor: name, status: 'allocated', room: bed.bedNumber });
      } else {
        results.push({ doctor: name, status: 'no_room_available', room: null });
      }
    }

    const allocated = results.filter(r => r.status === 'allocated').length;
    const skipped   = results.filter(r => r.status === 'already_allocated').length;
    const failed    = results.filter(r => r.status === 'no_room_available').length;

    res.json({ success: true, summary: `${allocated} doctors allocated, ${skipped} already had rooms, ${failed} could not be allocated`, allocated, skipped, failed, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/beds/auto-allocate/nurses
router.post('/auto-allocate/nurses', auth, async (req, res) => {
  try {
    const nurses = await Nurse.find({});
    const results = [];

    for (const nurse of nurses) {
      const name = `${nurse.firstName} ${nurse.lastName}`;

      const existing = await Bed.findOne({ bedPurpose: 'nurse_station', 'allocatedTo.id': nurse._id.toString() });
      if (existing) {
        results.push({ nurse: name, status: 'already_allocated', station: existing.bedNumber });
        continue;
      }

      const allocData = {
        status: 'Occupied',
        occupantType: 'nurse',
        assignedDate: new Date(),
        allocatedTo: { name, role: 'Nurse', id: nurse._id.toString(), department: nurse.ward || '' }
      };

      let bed = await Bed.findOneAndUpdate({ bedPurpose: 'nurse_station', status: 'Available', ward: nurse.ward }, allocData, { new: true });
      if (!bed) bed = await Bed.findOneAndUpdate({ bedPurpose: 'nurse_station', status: 'Available' }, allocData, { new: true });

      if (bed) {
        results.push({ nurse: name, status: 'allocated', station: bed.bedNumber });
      } else {
        results.push({ nurse: name, status: 'no_station_available', station: null });
      }
    }

    const allocated = results.filter(r => r.status === 'allocated').length;
    const skipped   = results.filter(r => r.status === 'already_allocated').length;
    const failed    = results.filter(r => r.status === 'no_station_available').length;

    res.json({ success: true, summary: `${allocated} nurses allocated, ${skipped} already had stations, ${failed} could not be allocated`, allocated, skipped, failed, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/beds/release-all/doctors
router.post('/release-all/doctors', auth, async (req, res) => {
  try {
    const result = await Bed.updateMany(
      { bedPurpose: 'doctor_room', status: 'Occupied' },
      { status: 'Available', occupantType: 'unoccupied', assignedDate: null, allocatedTo: { name: null, role: null, id: null, department: null } }
    );
    res.json({ success: true, released: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/beds/release-all/nurses
router.post('/release-all/nurses', auth, async (req, res) => {
  try {
    const result = await Bed.updateMany(
      { bedPurpose: 'nurse_station', status: 'Occupied' },
      { status: 'Available', occupantType: 'unoccupied', assignedDate: null, allocatedTo: { name: null, role: null, id: null, department: null } }
    );
    res.json({ success: true, released: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
