const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const DiseaseDetection = require('../models/DiseaseDetection');
const MedicalReport = require('../models/MedicalReport');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/medical-files';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload medical files
router.post('/upload-medical-files', auth, upload.array('medicalFiles', 10), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { patientId, uploadType } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Create file URLs
    const fileUrls = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/medical-files/${file.filename}`,
      uploadedAt: new Date(),
      uploadedBy: doctor._id
    }));

    // You can save file information to database if needed
    // For now, just return the file URLs
    
    res.json({
      success: true,
      message: `${req.files.length} file(s) uploaded successfully`,
      fileUrls: fileUrls,
      uploadType: uploadType
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      message: 'File upload failed', 
      error: error.message 
    });
  }
});

// Get doctor's appointments
router.get('/appointments', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { status, date } = req.query;
    let query = { doctor: doctor._id };
    
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName patientId phone email dateOfBirth gender')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor dashboard stats
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.countDocuments({
      doctor: doctor._id,
      appointmentDate: { $gte: today, $lt: tomorrow }
    });

    const completedToday = await Appointment.countDocuments({
      doctor: doctor._id,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: 'Completed'
    });

    // Count unique patients from appointments
    const uniquePatients = await Appointment.distinct('patient', { doctor: doctor._id });
    const totalPatients = uniquePatients.length;
    
    const recentDetections = await DiseaseDetection.find({ doctor: doctor._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('patient', 'firstName lastName patientId');

    res.json({
      todayAppointments,
      completedToday,
      totalPatients,
      recentDetections
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Detect disease using ML
router.post('/detect-disease', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { patientId, symptoms, vitalSigns, appointmentId, medicalFiles } = req.body;

    // Call ML service
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL || 'http://localhost:5001'}/predict`, {
      patient_info: {
        age: vitalSigns.age || 35,
        gender: vitalSigns.gender || 'Male'
      },
      symptoms: symptoms.reduce((acc, symptom) => {
        acc[symptom] = 1;
        return acc;
      }, {})
    });

    if (!mlResponse.data.prediction) {
      return res.status(500).json({ message: 'ML prediction failed' });
    }

    const detection = new DiseaseDetection({
      patient: patientId,
      doctor: doctor._id,
      appointment: appointmentId,
      symptoms,
      vitalSigns,
      predictedDisease: mlResponse.data.prediction.predicted_condition,
      confidence: mlResponse.data.prediction.confidence,
      allProbabilities: mlResponse.data.prediction.all_probabilities,
      medicalFiles: medicalFiles || []
    });

    await detection.save();

    // Update doctor's ML stats
    if (doctor.mlStats) {
      doctor.mlStats.totalPredictions = (doctor.mlStats.totalPredictions || 0) + 1;
      doctor.mlStats.lastPredictionDate = new Date();
      doctor.mlStats.averageConfidence = 
        ((doctor.mlStats.averageConfidence || 0) * (doctor.mlStats.totalPredictions - 1) + detection.confidence) / 
        doctor.mlStats.totalPredictions;
      await doctor.save();
    }

    res.json({
      success: true,
      detection: await detection.populate('patient', 'firstName lastName patientId')
    });
  } catch (error) {
    console.error('Disease detection error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: error.response?.data || 'ML service may not be running'
    });
  }
});

// Get previous reports for a patient
router.get('/patient/:patientId/reports', auth, async (req, res) => {
  try {
    const reports = await MedicalReport.find({ 
      patient: req.params.patientId 
    })
    .populate('doctor', 'firstName lastName specialization')
    .populate('diseaseDetection')
    .sort({ reportDate: -1 });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate medical report
router.post('/generate-report', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const reportData = {
      ...req.body,
      doctor: doctor._id
    };

    const report = new MedicalReport(reportData);
    await report.save();

    const populatedReport = await MedicalReport.findById(report._id)
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor', 'firstName lastName specialization')
      .populate('diseaseDetection');

    res.json({
      success: true,
      report: populatedReport
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
router.patch('/appointments/:id/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    ).populate('patient', 'firstName lastName patientId');

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's patients (from appointments)
router.get('/my-patients', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Get unique patient IDs from doctor's appointments
    const appointments = await Appointment.find({ doctor: doctor._id }).distinct('patient');
    
    // Get patient details
    const patients = await Patient.find({ _id: { $in: appointments } })
      .sort({ createdAt: -1 });

    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient details
router.get('/patient/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'firstName lastName specialization');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
