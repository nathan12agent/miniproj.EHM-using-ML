const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  reportType: {
    type: String,
    enum: ['Lab Test', 'X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Blood Test', 'Other'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  findings: String,
  diagnosis: String,
  recommendations: String,
  testResults: [{
    testName: String,
    value: String,
    normalRange: String,
    unit: String,
    status: {
      type: String,
      enum: ['Normal', 'Abnormal', 'Critical']
    }
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String
  }],
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Reviewed'],
    default: 'Pending'
  },
  reportDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

reportSchema.pre('save', async function(next) {
  if (!this.reportId) {
    const count = await this.constructor.countDocuments();
    this.reportId = `REP${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Report', reportSchema);
