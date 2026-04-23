const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true  // Format: "HH:mm"
  },
  duration: {
    type: Number,
    default: 15  // minutes
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'cancelled'],
    default: 'available'
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate slots for same doctor/date/time
slotSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true });
slotSchema.index({ doctor: 1, date: 1, status: 1 });

module.exports = mongoose.model('Slot', slotSchema);
