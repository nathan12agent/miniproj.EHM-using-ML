const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema({
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
  diseaseDetection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiseaseDetection'
  },
  reportType: {
    type: String,
    enum: ['Consultation', 'Diagnosis', 'Treatment', 'Follow-up', 'Discharge'],
    default: 'Consultation'
  },
  chiefComplaint: String,
  presentIllness: String,
  symptoms: [String],
  vitalSigns: {
    temperature: Number,
    bloodPressure: String,
    heartRate: Number,
    respiratoryRate: Number,
    weight: Number,
    height: Number,
    bmi: Number
  },
  physicalExamination: String,
  diagnosis: {
    primary: String,
    secondary: [String],
    mlPredicted: String,
    confidence: Number
  },
  investigations: [{
    testName: String,
    result: String,
    date: Date
  }],
  treatment: {
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    procedures: [String],
    advice: String
  },
  prognosis: String,
  followUpDate: Date,
  followUpInstructions: String,
  previousReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalReport'
  }],
  status: {
    type: String,
    enum: ['Draft', 'Completed', 'Reviewed', 'Archived'],
    default: 'Draft'
  },
  reportDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

medicalReportSchema.pre('save', async function(next) {
  if (!this.reportId) {
    const count = await this.constructor.countDocuments();
    this.reportId = `MR${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
