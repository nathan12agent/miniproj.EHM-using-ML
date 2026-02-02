const express = require('express');
const router = express.Router();
const PatientRecord = require('../models/PatientRecord');
const auth = require('../middleware/auth');

// Create a new patient record
router.post('/', auth, async (req, res) => {
  try {
    const {
      patientId,
      name,
      age,
      gender,
      medicalHistory,
      symptoms,
      diagnosis,
      similarPatients,
      treatmentPlan,
      notes
    } = req.body;

    // Check if patient record already exists
    let existingRecord = await PatientRecord.findOne({ patientId });
    
    if (existingRecord) {
      // Update existing record
      existingRecord.name = name;
      existingRecord.age = age;
      existingRecord.gender = gender;
      existingRecord.medicalHistory = medicalHistory;
      existingRecord.symptoms = symptoms;
      existingRecord.diagnosis = diagnosis;
      existingRecord.similarPatients = similarPatients;
      existingRecord.treatmentPlan = treatmentPlan;
      existingRecord.doctorId = req.user.id;
      existingRecord.doctorName = req.user.name;
      existingRecord.reportDate = new Date();
      existingRecord.notes = notes;

      await existingRecord.save();
      res.json(existingRecord);
    } else {
      // Create new record
      const patientRecord = new PatientRecord({
        patientId,
        name,
        age,
        gender,
        medicalHistory,
        symptoms,
        diagnosis,
        similarPatients,
        treatmentPlan,
        doctorId: req.user.id,
        doctorName: req.user.name,
        notes
      });

      await patientRecord.save();
      res.status(201).json(patientRecord);
    }
  } catch (error) {
    console.error('Error creating patient record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all patient records for a doctor
router.get('/', auth, async (req, res) => {
  try {
    const records = await PatientRecord.find({ doctorId: req.user.id })
      .sort({ reportDate: -1 })
      .limit(50);
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching patient records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific patient record
router.get('/:patientId', auth, async (req, res) => {
  try {
    const record = await PatientRecord.findOne({ 
      patientId: req.params.patientId,
      doctorId: req.user.id 
    });
    
    if (!record) {
      return res.status(404).json({ message: 'Patient record not found' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Error fetching patient record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update patient status
router.patch('/:patientId/status', auth, async (req, res) => {
  try {
    const { status, followUpDate, notes } = req.body;
    
    const record = await PatientRecord.findOneAndUpdate(
      { patientId: req.params.patientId, doctorId: req.user.id },
      { 
        status, 
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        notes 
      },
      { new: true }
    );
    
    if (!record) {
      return res.status(404).json({ message: 'Patient record not found' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Error updating patient status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get similar patients for ML training
router.get('/similar/:condition', auth, async (req, res) => {
  try {
    const condition = req.params.condition;
    const similarRecords = await PatientRecord.find({
      'diagnosis.predictedCondition': new RegExp(condition, 'i')
    })
    .select('patientId name age gender symptoms diagnosis treatmentPlan status')
    .limit(10);
    
    res.json(similarRecords);
  } catch (error) {
    console.error('Error fetching similar patients:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Analytics endpoint for ML improvement
router.get('/analytics/accuracy', auth, async (req, res) => {
  try {
    const totalRecords = await PatientRecord.countDocuments({ doctorId: req.user.id });
    const highConfidenceRecords = await PatientRecord.countDocuments({
      doctorId: req.user.id,
      'diagnosis.confidence': { $gte: 0.8 }
    });
    const recoveredPatients = await PatientRecord.countDocuments({
      doctorId: req.user.id,
      status: 'Recovered'
    });

    const accuracy = totalRecords > 0 ? (highConfidenceRecords / totalRecords * 100).toFixed(1) : 0;
    const recoveryRate = totalRecords > 0 ? (recoveredPatients / totalRecords * 100).toFixed(1) : 0;

    res.json({
      totalRecords,
      highConfidenceRecords,
      recoveredPatients,
      accuracy: parseFloat(accuracy),
      recoveryRate: parseFloat(recoveryRate)
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;