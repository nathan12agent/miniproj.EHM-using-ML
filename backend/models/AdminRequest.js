const mongoose = require('mongoose');

const adminRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
    default: () => 'REQ' + Date.now().toString().slice(-8)
  },
  fromDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  fromDoctorName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['bed_request', 'nurse_request', 'equipment_request', 'patient_info', 'general', 'urgent'],
    default: 'general'
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'seen', 'resolved'],
    default: 'pending'
  },
  adminNote: {
    type: String,
    trim: true
  },
  resolvedAt: {
    type: Date
  }
}, { timestamps: true });

adminRequestSchema.index({ status: 1, createdAt: -1 });
adminRequestSchema.index({ fromDoctorId: 1 });

module.exports = mongoose.model('AdminRequest', adminRequestSchema);
