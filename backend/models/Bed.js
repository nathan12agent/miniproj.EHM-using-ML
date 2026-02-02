const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  bedNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  ward: {
    type: String,
    required: true,
    enum: ['ICU', 'General', 'Emergency', 'Pediatric', 'Maternity'],
    default: 'General'
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Occupied', 'Maintenance', 'Reserved'],
    default: 'Available'
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  assignedDate: {
    type: Date,
    default: null
  },
  dischargeDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true
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
bedSchema.index({ bedNumber: 1 });
bedSchema.index({ ward: 1, status: 1 });
bedSchema.index({ patient: 1 });

// Method to assign bed to patient
bedSchema.methods.assignToPatient = function(patientId, userId) {
  this.status = 'Occupied';
  this.patient = patientId;
  this.assignedDate = new Date();
  this.dischargeDate = null;
  this.updatedBy = userId;
  return this.save();
};

// Method to discharge patient from bed
bedSchema.methods.dischargePatient = function(userId) {
  this.status = 'Available';
  this.dischargeDate = new Date();
  const previousPatient = this.patient;
  this.patient = null;
  this.updatedBy = userId;
  return this.save().then(() => previousPatient);
};

// Static method to get available beds by ward
bedSchema.statics.getAvailableByWard = function(ward) {
  const query = { status: 'Available' };
  if (ward && ward !== 'All') {
    query.ward = ward;
  }
  return this.find(query).sort({ bedNumber: 1 });
};

// Static method to get bed occupancy stats
bedSchema.statics.getOccupancyStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$ward',
        total: { $sum: 1 },
        occupied: {
          $sum: { $cond: [{ $eq: ['$status', 'Occupied'] }, 1, 0] }
        },
        available: {
          $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] }
        },
        maintenance: {
          $sum: { $cond: [{ $eq: ['$status', 'Maintenance'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('Bed', bedSchema);
