const mongoose = require('mongoose');

const nurseSchema = new mongoose.Schema({
  nurseId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'N' + Date.now().toString().slice(-8);
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
  ward: {
    type: String,
    required: true,
    enum: ['ICU', 'General', 'Emergency', 'Pediatric', 'Maternity'],
    default: 'General'
  },
  shift: {
    type: String,
    required: true,
    enum: ['Morning', 'Evening', 'Night'],
    default: 'Morning'
  },
  status: {
    type: String,
    required: true,
    enum: ['On Duty', 'On Break', 'Off Duty'],
    default: 'Off Duty'
  },
  assignedPatients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  }],
  specialization: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    default: 0
  },
  workingHours: {
    type: Number,
    default: 8,
    min: 0,
    max: 24
  },
  maxPatientLoad: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
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

// Indexes
nurseSchema.index({ nurseId: 1 });
nurseSchema.index({ email: 1 });
nurseSchema.index({ ward: 1, status: 1 });

// Virtual for full name
nurseSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for patient count
nurseSchema.virtual('patientCount').get(function() {
  return this.assignedPatients ? this.assignedPatients.length : 0;
});

// Method to assign patient to nurse
nurseSchema.methods.assignPatient = function(patientId) {
  if (!this.assignedPatients.includes(patientId)) {
    this.assignedPatients.push(patientId);
  }
  return this.save();
};

// Method to remove patient from nurse
nurseSchema.methods.removePatient = function(patientId) {
  this.assignedPatients = this.assignedPatients.filter(
    id => id.toString() !== patientId.toString()
  );
  return this.save();
};

// Method to calculate availability score (higher is better)
nurseSchema.methods.getAvailabilityScore = function() {
  const currentLoad = this.assignedPatients ? this.assignedPatients.length : 0;
  const loadPercentage = (currentLoad / this.maxPatientLoad) * 100;
  
  // Score based on:
  // - Available capacity (50% weight)
  // - Working hours (30% weight)
  // - Experience (20% weight)
  const capacityScore = Math.max(0, 100 - loadPercentage) * 0.5;
  const hoursScore = (this.workingHours / 12) * 100 * 0.3; // Normalize to 12 hours
  const experienceScore = Math.min(this.experience * 5, 100) * 0.2; // Cap at 20 years
  
  return capacityScore + hoursScore + experienceScore;
};

// Method to check if nurse can take more patients
nurseSchema.methods.canTakePatient = function() {
  const currentLoad = this.assignedPatients ? this.assignedPatients.length : 0;
  return currentLoad < this.maxPatientLoad && this.status === 'On Duty';
};

// Static method to get nurses by ward
nurseSchema.statics.getByWard = function(ward, status = null) {
  const query = { ward };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('assignedPatients', 'firstName lastName patientId')
    .sort({ lastName: 1 });
};

// Static method to find best nurse for assignment
nurseSchema.statics.findBestNurseForAssignment = async function(ward) {
  const nurses = await this.find({
    ward,
    status: 'On Duty'
  }).populate('assignedPatients');
  
  if (nurses.length === 0) return null;
  
  // Calculate scores and sort
  const nursesWithScores = nurses
    .filter(nurse => nurse.canTakePatient())
    .map(nurse => ({
      nurse,
      score: nurse.getAvailabilityScore()
    }))
    .sort((a, b) => b.score - a.score);
  
  return nursesWithScores.length > 0 ? nursesWithScores[0].nurse : null;
};

module.exports = mongoose.model('Nurse', nurseSchema);
