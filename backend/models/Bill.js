const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billId: {
    type: String,
    unique: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partially Paid', 'Cancelled'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Insurance', 'Online', 'UPI', 'Card', 'NetBanking', 'Wallet', ''],
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueDate: Date,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  insuranceClaimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim'
  }
}, {
  timestamps: true
});

billSchema.pre('save', async function(next) {
  if (!this.billId) {
    const count = await this.constructor.countDocuments();
    this.billId = `BILL${String(count + 1).padStart(6, '0')}`;
  }
  // Normalize empty paymentMethod to undefined so it doesn't fail enum
  if (this.paymentMethod === '') {
    this.paymentMethod = undefined;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);
