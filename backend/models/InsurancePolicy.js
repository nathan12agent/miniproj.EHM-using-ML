const mongoose = require('mongoose');

const insurancePolicySchema = new mongoose.Schema({
  policyId: {
    type: String,
    unique: true,
    sparse: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  providerName: {
    type: String,
    required: true,
    trim: true
  },
  policyNumber: {
    type: String,
    required: true,
    trim: true
  },
  coverageType: {
    type: String,
    enum: ['Basic', 'Standard', 'Premium', 'Comprehensive'],
    required: true
  },
  coverageAmount: {
    type: Number,
    required: true,
    min: [1, 'Coverage amount must be greater than 0']
  },
  usedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  coveredDiagnoses: [{
    type: String,
    trim: true
  }],

  isSeeded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

insurancePolicySchema.pre('save', async function(next) {
  if (!this.policyId) {
    const count = await this.constructor.countDocuments();
    this.policyId = `POL${String(count + 1).padStart(6, '0')}`;
  }
  if (this.usedAmount > this.coverageAmount) {
    return next(new Error('usedAmount cannot exceed coverageAmount'));
  }
  if (this.expiryDate <= this.startDate) {
    return next(new Error('expiryDate must be after startDate'));
  }
  next();
});

module.exports = mongoose.model('InsurancePolicy', insurancePolicySchema);
