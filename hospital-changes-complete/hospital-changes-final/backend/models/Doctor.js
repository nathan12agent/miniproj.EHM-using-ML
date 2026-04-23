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
    required: false,
    trim: true
  },
  lastName: {
    type: String,
    required: false,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  gender: {
    type: String,
    required: false,
    enum: ['Male', 'Female', 'Other']
  },
  
  // Contact Information
  phone: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false,
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
    required: false
  },
  specialization: {
    type: String,
    required: false,
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
    required: false,
    min: 0
  },
  
  // Department & Schedule
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false
  },
  
  // Enhanced Schedule with Slot-Based Booking
  schedule: {
    monday: {
      isAvailable: { type: Boolean, default: true },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' },
      slotDuration: { type: Number, default: 30, enum: [15, 30, 45, 60] }, // minutes
      breakTimes: [{
        startTime: String,
        endTime: String
      }]
    },
    tuesday: {
      isAvailable: { type: Boolean, default: true },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' },
      slotDuration: { type: Number, default: 30, enum: [15, 30, 45, 60] },
      breakTimes: [{
        startTime: String,
        endTime: String
      }]
    },
    wednesday: {
      isAvailable: { type: Boolean, default: true },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' },
      slotDuration: { type: Number, default: 30, enum: [15, 30, 45, 60] },
      breakTimes: [{
        startTime: String,
        endTime: String
      }]
    },
    thursday: {
      isAvailable: { type: Boolean, default: true },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' },
      slotDuration: { type: Number, default: 30, enum: [15, 30, 45, 60] },
      breakTimes: [{
        startTime: String,
        endTime: String
      }]
    },
    friday: {
      isAvailable: { type: Boolean, default: true },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' },
      slotDuration: { type: Number, default: 30, enum: [15, 30, 45, 60] },
      breakTimes: [{
        startTime: String,
        endTime: String
      }]
    },
    saturday: {
      isAvailable: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '13:00' },
      slotDuration: { type: Number, default: 30, enum: [15, 30, 45, 60] },
      breakTimes: [{
        startTime: String,
        endTime: String
      }]
    },
    sunday: {
      isAvailable: { type: Boolean, default: false },
      startTime: String,
      endTime: String,
      slotDuration: { type: Number, default: 30, enum: [15, 30, 45, 60] },
      breakTimes: [{
        startTime: String,
        endTime: String
      }]
    }
  },
  
  // Default slot duration (can be overridden per day)
  defaultSlotDuration: {
    type: Number,
    default: 30,
    enum: [15, 30, 45, 60]
  },
  
  // Consultation Fee
  consultationFee: {
    type: Number,
    required: false,
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
    required: false
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
    required: false
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
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const daySchedule = this.schedule[dayOfWeek];
  
  if (!daySchedule || !daySchedule.isAvailable) {
    return false;
  }
  
  const startTime = new Date(`1970-01-01T${daySchedule.startTime}:00`);
  const endTime = new Date(`1970-01-01T${daySchedule.endTime}:00`);
  const checkTime = new Date(`1970-01-01T${time}:00`);
  
  return checkTime >= startTime && checkTime <= endTime;
};

// Method to generate time slots for a specific date
doctorSchema.methods.generateTimeSlots = function(date) {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const daySchedule = this.schedule[dayOfWeek];
  
  if (!daySchedule || !daySchedule.isAvailable) {
    return [];
  }
  
  const slots = [];
  const slotDuration = daySchedule.slotDuration || this.defaultSlotDuration || 30;
  
  // Parse start and end times
  const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number);
  const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number);
  
  let currentTime = new Date(date);
  currentTime.setHours(startHour, startMinute, 0, 0);
  
  const endTime = new Date(date);
  endTime.setHours(endHour, endMinute, 0, 0);
  
  // Generate slots
  while (currentTime < endTime) {
    const slotStart = new Date(currentTime);
    const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
    
    // Check if slot is within working hours
    if (slotEnd <= endTime) {
      const startTimeStr = slotStart.toTimeString().substring(0, 5);
      const endTimeStr = slotEnd.toTimeString().substring(0, 5);
      
      // Check if slot overlaps with break times
      const isBreakTime = daySchedule.breakTimes && daySchedule.breakTimes.some(breakTime => {
        const breakStart = new Date(`1970-01-01T${breakTime.startTime}:00`);
        const breakEnd = new Date(`1970-01-01T${breakTime.endTime}:00`);
        const slotStartCheck = new Date(`1970-01-01T${startTimeStr}:00`);
        const slotEndCheck = new Date(`1970-01-01T${endTimeStr}:00`);
        
        // Check if slot overlaps with break
        return (slotStartCheck < breakEnd && slotEndCheck > breakStart);
      });
      
      if (!isBreakTime) {
        slots.push({
          startTime: startTimeStr,
          endTime: endTimeStr,
          duration: slotDuration
        });
      }
    }
    
    currentTime = slotEnd;
  }
  
  return slots;
};

// Method to validate if a time slot is valid for booking
doctorSchema.methods.isValidTimeSlot = function(date, time) {
  const slots = this.generateTimeSlots(date);
  return slots.some(slot => slot.startTime === time);
};

// Method to get available slots (excluding booked ones)
doctorSchema.methods.getAvailableSlots = async function(date) {
  const Appointment = require('./Appointment');
  
  // Generate all possible slots
  const allSlots = this.generateTimeSlots(date);
  
  if (allSlots.length === 0) {
    return [];
  }
  
  // Get booked appointments for this doctor on this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const bookedAppointments = await Appointment.find({
    doctor: this._id,
    appointmentDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $nin: ['Cancelled', 'Rejected'] }
  }).select('appointmentTime');
  
  // Create set of booked times for fast lookup
  const bookedTimes = new Set(bookedAppointments.map(apt => apt.appointmentTime));
  
  // Filter out booked slots
  const availableSlots = allSlots.filter(slot => !bookedTimes.has(slot.startTime));
  
  return availableSlots;
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