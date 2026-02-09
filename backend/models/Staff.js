const mongoose = require('mongoose');

const shiftHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  shift: { type: String, enum: ['Day', 'Night', 'Rotating'], required: true },
  hoursWorked: { type: Number, required: true },
  patientLoad: { type: Number, default: 0 }
}, { _id: false });

const absenceHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  reason: { type: String, required: true },
  duration: { type: Number, required: true } // days
}, { _id: false });

const staffSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Doctor', 'Nurse', 'Technician', 'Receptionist', 'Admin', 'Other']
  },
  department: {
    type: String,
    required: true,
    enum: ['ICU', 'ER', 'General Ward', 'Lab', 'Admin', 'Radiology', 'Pharmacy', 'Other']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  experienceYears: {
    type: Number,
    required: true,
    min: 0
  },
  specialization: [{
    type: String
  }],
  shiftPreference: {
    type: String,
    enum: ['Day', 'Night', 'Rotating'],
    default: 'Day'
  },
  distanceFromHospital: {
    type: Number, // in kilometers
    default: 0
  },
  currentStatus: {
    type: String,
    enum: ['On-Duty', 'Off-Duty', 'On-Leave', 'Absent'],
    default: 'Off-Duty'
  },
  performanceRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  
  // ML-related fields
  absenteeismRisk: {
    probability: { type: Number, min: 0, max: 100 },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
    lastUpdated: { type: Date }
  },
  burnoutRisk: {
    level: { type: String, enum: ['Low', 'Medium', 'High'] },
    score: { type: Number, min: 0, max: 100 },
    lastUpdated: { type: Date }
  },
  cluster: {
    id: { type: Number },
    label: { type: String },
    lastUpdated: { type: Date }
  },
  
  // Historical data
  shiftHistory: [shiftHistorySchema],
  absenceHistory: [absenceHistorySchema]
}, {
  timestamps: true
});

// Indexes for better query performance
staffSchema.index({ role: 1, department: 1 });
staffSchema.index({ currentStatus: 1 });
staffSchema.index({ 'absenteeismRisk.riskLevel': 1 });
staffSchema.index({ 'burnoutRisk.level': 1 });

module.exports = mongoose.model('Staff', staffSchema);
