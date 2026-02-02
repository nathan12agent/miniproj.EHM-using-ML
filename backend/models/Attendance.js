const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  attendanceId: {
    type: String,
    unique: true,
    required: true
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'staffModel',
    required: true
  },
  staffModel: {
    type: String,
    required: true,
    enum: ['User', 'Doctor']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  clockIn: {
    time: {
      type: Date,
      required: true
    },
    location: {
      latitude: Number,
      longitude: Number
    },
    device: String,
    ipAddress: String
  },
  clockOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number
    },
    device: String,
    ipAddress: String
  },
  breaks: [{
    breakStart: Date,
    breakEnd: Date,
    duration: Number, // in minutes
    reason: String
  }],
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'On Leave', 'Holiday'],
    default: 'Present'
  },
  shift: {
    type: String,
    enum: ['Morning', 'Evening', 'Night', 'General'],
    default: 'General'
  },
  notes: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isApproved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate unique attendance ID
attendanceSchema.pre('save', async function(next) {
  if (!this.attendanceId) {
    const count = await this.constructor.countDocuments();
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    this.attendanceId = `ATT${date}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate total hours when clock out is recorded
attendanceSchema.pre('save', function(next) {
  if (this.clockIn.time && this.clockOut.time) {
    const diffMs = this.clockOut.time - this.clockIn.time;
    let totalMinutes = Math.floor(diffMs / 60000);
    
    // Subtract break time
    if (this.breaks && this.breaks.length > 0) {
      const breakMinutes = this.breaks.reduce((sum, brk) => sum + (brk.duration || 0), 0);
      totalMinutes -= breakMinutes;
    }
    
    this.totalHours = (totalMinutes / 60).toFixed(2);
  }
  next();
});

// Indexes for faster queries
attendanceSchema.index({ staff: 1, date: -1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });

// Static method to get attendance summary
attendanceSchema.statics.getAttendanceSummary = async function(staffId, startDate, endDate) {
  const attendances = await this.find({
    staff: staffId,
    date: { $gte: startDate, $lte: endDate }
  });

  const summary = {
    totalDays: attendances.length,
    present: attendances.filter(a => a.status === 'Present').length,
    absent: attendances.filter(a => a.status === 'Absent').length,
    late: attendances.filter(a => a.status === 'Late').length,
    halfDay: attendances.filter(a => a.status === 'Half Day').length,
    onLeave: attendances.filter(a => a.status === 'On Leave').length,
    totalHours: attendances.reduce((sum, a) => sum + (parseFloat(a.totalHours) || 0), 0),
    averageHours: 0
  };

  summary.averageHours = summary.present > 0 
    ? (summary.totalHours / summary.present).toFixed(2) 
    : 0;

  return summary;
};

module.exports = mongoose.model('Attendance', attendanceSchema);
