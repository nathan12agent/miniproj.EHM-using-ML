const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  claimId: {
    type: String,
    unique: true,
    sparse: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InsurancePolicy',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  diagnosisCode: {
    type: String,
    required: true,
    trim: true
  },
  diagnosisName: {
    type: String,
    required: true,
    trim: true
  },
  treatmentCode: {
    type: String,
    required: true,
    trim: true
  },
  claimAmount: {
    type: Number,
    required: true,
    min: [1, 'Claim amount must be greater than 0']
  },
  approvedAmount: {
    type: Number,
    default: 0
  },
  claimDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  fraudScore: {
    type: Number,
    default: -1,
    min: -1,
    max: 1
  },
  fraudReasons: [{
    type: String
  }],
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  patientLiability: {
    type: Number,
    default: 0
  },
  adminNote: {
    type: String
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  refundedAt: {
    type: Date
  }
}, {
  timestamps: true
});

claimSchema.pre('save', async function(next) {
  if (!this.claimId) {
    const count = await this.constructor.countDocuments();
    this.claimId = `CLM${String(count + 1).padStart(6, '0')}`;
  }
  if (this.approvedAmount > this.claimAmount) {
    return next(new Error('approvedAmount cannot exceed claimAmount'));
  }
  next();
});

module.exports = mongoose.model('Claim', claimSchema);
