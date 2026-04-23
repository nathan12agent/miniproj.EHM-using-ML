const mongoose = require('mongoose');

const timeRangeSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true  // Format: "HH:mm"
  },
  endTime: {
    type: String,
    required: true  // Format: "HH:mm"
  }
}, { _id: false });

const doctorAvailabilitySchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  timeRanges: {
    type: [timeRangeSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one time range is required'
    }
  },
  slotDuration: {
    type: Number,
    default: 15,  // minutes - can be 10 or 15
    enum: [10, 15]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index: one availability entry per doctor per day
doctorAvailabilitySchema.index({ doctor: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);
