const mongoose = require('mongoose');

const diseaseDetectionSchema = new mongoose.Schema({
  detectionId: {
    type: String,
    unique: true,
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  symptoms: [{
    type: String
  }],
  vitalSigns: {
    temperature: Number,
    bloodPressureSystolic: Number,
    bloodPressureDiastolic: Number,
    heartRate: Number,
    respiratoryRate: Number,
    oxygenSaturation: Number
  },
  predictedDisease: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  allProbabilities: {
    type: Map,
    of: Number
  },
  medicalFiles: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    }
  }],
  actualDiagnosis: String,
  notes: String,
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Rejected'],
    default: 'Pending'
  },
  detectionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

diseaseDetectionSchema.pre('save', async function(next) {
  if (!this.detectionId) {
    const count = await this.constructor.countDocuments();
    this.detectionId = `DET${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('DiseaseDetection', diseaseDetectionSchema);
