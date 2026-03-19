const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true,
    sparse: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  claimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim'
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill'
  },
  billAmount: {
    type: Number,
    required: true,
    min: [0, 'Bill amount cannot be negative']
  },
  insuranceCovered: {
    type: Number,
    default: 0,
    min: 0
  },
  patientLiability: {
    type: Number,
    default: 0
  },
  amountDue: {
    type: Number,
    default: 0
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  razorpayOrderId: {
    type: String,
    trim: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true
  },
  razorpaySignature: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Card', 'NetBanking', 'Wallet', 'Cash'],
    default: 'Cash'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  refundReason: {
    type: String,
    default: ''
  },
  refundedAt: {
    type: Date
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

paymentSchema.pre('save', async function(next) {
  if (!this.paymentId) {
    const count = await this.constructor.countDocuments();
    this.paymentId = `PAY${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
