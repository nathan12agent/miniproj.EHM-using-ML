const mongoose = require('mongoose');

const patientRecordSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  medicalHistory: {
    type: String,
    default: ''
  },
  symptoms: [{
    type: String
  }],
  diagnosis: {
    predictedCondition: String,
    confidence: Number,
    alternativeDiagnoses: [{
      condition: String,
      probability: Number
    }]
  },
  similarPatients: [{
    patientId: String,
    similarity: Number,
    outcome: String
  }],
  treatmentPlan: {
    immediate: [String],
    medications: [String],
    lifestyle: [String],
    severity: String
  },
  doctorId: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  reportDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Recovered', 'Under Treatment', 'Follow-up Required'],
    default: 'Active'
  },
  followUpDate: Date,
  notes: String
}, {
  timestamps: true
});

// Index for faster queries
patientRecordSchema.index({ patientId: 1 });
patientRecordSchema.index({ doctorId: 1 });
patientRecordSchema.index({ 'diagnosis.predictedCondition': 1 });
patientRecordSchema.index({ reportDate: -1 });

module.exports = mongoose.model('PatientRecord', patientRecordSchema);