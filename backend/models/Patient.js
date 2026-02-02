const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // Personal Information
  patientId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'P' + Date.now().toString().slice(-8);
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  
  // Contact Information
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  // Medical Information
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    status: {
      type: String,
      enum: ['Active', 'Resolved', 'Chronic'],
      default: 'Active'
    },
    notes: String
  }],
  
  allergies: [{
    allergen: String,
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe'],
      default: 'Mild'
    },
    reaction: String
  }],
  
  currentMedications: [{
    medication: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    }
  }],
  
  // Assigned Doctor
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  
  // Insurance Information
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    expiryDate: Date
  },
  
  // ML Risk Scores (calculated by ML service)
  riskScores: {
    mortalityRisk: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    readmissionRisk: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // System Information
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Deceased'],
    default: 'Active'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastVisit: Date,
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
patientSchema.index({ patientId: 1 });
patientSchema.index({ email: 1 });
patientSchema.index({ phone: 1 });
patientSchema.index({ 'riskScores.mortalityRisk': -1 });

// Virtual for full name
patientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
patientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Method to calculate risk scores (to be called by ML service)
patientSchema.methods.updateRiskScores = function(scores) {
  this.riskScores = {
    ...scores,
    lastUpdated: new Date()
  };
  return this.save();
};

// Static method to find high-risk patients
patientSchema.statics.findHighRiskPatients = function(riskThreshold = 0.7) {
  return this.find({
    $or: [
      { 'riskScores.mortalityRisk': { $gte: riskThreshold } },
      { 'riskScores.readmissionRisk': { $gte: riskThreshold } }
    ],
    status: 'Active'
  });
};

module.exports = mongoose.model('Patient', patientSchema);