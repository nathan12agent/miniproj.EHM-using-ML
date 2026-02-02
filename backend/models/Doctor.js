const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  // Personal Information
  doctorId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'D' + Date.now().toString().slice(-8);
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
  
  // Contact Information
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
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
  
  // Professional Information
  medicalLicenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true,
    enum: [
      'General Medicine',
      'Cardiology',
      'Neurology',
      'Orthopedics',
      'Pediatrics',
      'Gynecology',
      'Dermatology',
      'Psychiatry',
      'Radiology',
      'Anesthesiology',
      'Emergency Medicine',
      'Surgery',
      'Oncology',
      'Endocrinology',
      'Gastroenterology',
      'Pulmonology',
      'Nephrology',
      'Ophthalmology',
      'ENT',
      'Urology'
    ]
  },
  subSpecialization: String,
  
  // Education & Qualifications
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
    country: String
  }],
  
  // Experience
  experience: {
    type: Number, // years of experience
    required: true,
    min: 0
  },
  
  // Department & Schedule
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  
  schedule: {
    monday: {
      isAvailable: { type: Boolean, default: true },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' }
    },
    tuesday: {
      isAvailable: { type: Boolean, default: true },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' }
    },
    wednesday: {
      isAvailable: { type: Boolean, default: true },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' }
    },
    thursday: {
      isAvailable: { type: Boolean, default: true },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' }
    },
    friday: {
      isAvailable: { type: Boolean, default: true },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' }
    },
    saturday: {
      isAvailable: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '13:00' }
    },
    sunday: {
      isAvailable: { type: Boolean, default: false },
      startTime: String,
      endTime: String
    }
  },
  
  // Consultation Fee
  consultationFee: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Performance Metrics (for ML optimization)
  metrics: {
    totalPatients: { type: Number, default: 0 },
    averageConsultationTime: { type: Number, default: 30 }, // minutes
    patientSatisfactionScore: { type: Number, min: 1, max: 5, default: 4.0 },
    successRate: { type: Number, min: 0, max: 1, default: 0.85 },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // System Information
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave', 'Suspended'],
    default: 'Active'
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  
  // ML Access Control (Enhanced for ML Integration)
  mlAccess: {
    type: Boolean,
    default: false,
    required: true
  },
  mlAccessGrantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mlAccessGrantedDate: Date,
  
  // ML Usage Statistics
  mlStats: {
    totalPredictions: { type: Number, default: 0 },
    lastPredictionDate: Date,
    averageConfidence: { type: Number, default: 0 },
    accuracyRating: { type: Number, default: 0 }
  },
  
  // User Account Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Profile Image
  profileImage: String,
  
  // Bio
  bio: {
    type: String,
    maxlength: 500
  },
  
  // Languages Spoken
  languages: [String],
  
  // Awards & Certifications
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    certificateNumber: String
  }]
}, {
  timestamps: true
});

// Indexes
doctorSchema.index({ doctorId: 1 });
doctorSchema.index({ email: 1 });
doctorSchema.index({ medicalLicenseNumber: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ department: 1 });

// Virtual for full name
doctorSchema.virtual('fullName').get(function() {
  return `Dr. ${this.firstName} ${this.lastName}`;
});

// Virtual for age
doctorSchema.virtual('age').get(function() {
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

// Method to check availability for a specific date and time
doctorSchema.methods.isAvailable = function(date, time) {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const daySchedule = this.schedule[dayOfWeek];
  
  if (!daySchedule || !daySchedule.isAvailable) {
    return false;
  }
  
  const startTime = new Date(`1970-01-01T${daySchedule.startTime}:00`);
  const endTime = new Date(`1970-01-01T${daySchedule.endTime}:00`);
  const checkTime = new Date(`1970-01-01T${time}:00`);
  
  return checkTime >= startTime && checkTime <= endTime;
};

// Static method to find available doctors by specialization
doctorSchema.statics.findAvailableDoctors = function(specialization, date, time) {
  return this.find({
    specialization: specialization,
    status: 'Active'
  }).then(doctors => {
    return doctors.filter(doctor => doctor.isAvailable(date, time));
  });
};

// Method to update performance metrics
doctorSchema.methods.updateMetrics = function(metrics) {
  this.metrics = {
    ...this.metrics,
    ...metrics,
    lastUpdated: new Date()
  };
  return this.save();
};

module.exports = mongoose.model('Doctor', doctorSchema);