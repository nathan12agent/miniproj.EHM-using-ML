// backend/scripts/seedData.js
// Run with: npm run seed
// Idempotent — safe to run multiple times, never creates duplicates

require('dotenv').config();
const mongoose = require('mongoose');

const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Nurse = require('../models/Nurse');
const Bed = require('../models/Bed');
const InsurancePolicy = require('../models/InsurancePolicy');
const Claim = require('../models/Claim');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management';
const PLAIN_PASSWORD = 'demo123';

// ─── Seed Data ────────────────────────────────────────────────────────────────

const DOCTORS = [
  {
    firstName: 'Arjun', lastName: 'Sharma',
    email: 'arjun.sharma@hospital.com',
    phone: '9876543210', gender: 'Male',
    dateOfBirth: new Date('1978-04-12'),
    medicalLicenseNumber: 'MH-DOC-001',
    specialization: 'Cardiology',
    experience: 18, consultationFee: 800,
    department: null,
    mlAccess: true,
  },
  {
    firstName: 'Priya', lastName: 'Nair',
    email: 'priya.nair@hospital.com',
    phone: '9876543211', gender: 'Female',
    dateOfBirth: new Date('1983-09-25'),
    medicalLicenseNumber: 'MH-DOC-002',
    specialization: 'Neurology',
    experience: 13, consultationFee: 900,
    department: null,
    mlAccess: true,
  },
  {
    firstName: 'Rahul', lastName: 'Verma',
    email: 'rahul.verma@hospital.com',
    phone: '9876543212', gender: 'Male',
    dateOfBirth: new Date('1980-01-30'),
    medicalLicenseNumber: 'MH-DOC-003',
    specialization: 'Orthopedics',
    experience: 15, consultationFee: 700,
    department: null,
    mlAccess: false,
  },
  {
    firstName: 'Sunita', lastName: 'Patel',
    email: 'sunita.patel@hospital.com',
    phone: '9876543213', gender: 'Female',
    dateOfBirth: new Date('1975-06-18'),
    medicalLicenseNumber: 'MH-DOC-004',
    specialization: 'Pediatrics',
    experience: 22, consultationFee: 600,
    department: null,
    mlAccess: true,
  },
  {
    firstName: 'Vikram', lastName: 'Singh',
    email: 'vikram.singh@hospital.com',
    phone: '9876543214', gender: 'Male',
    dateOfBirth: new Date('1985-11-05'),
    medicalLicenseNumber: 'MH-DOC-005',
    specialization: 'General Medicine',
    experience: 10, consultationFee: 500,
    department: null,
    mlAccess: false,
  },
];

const NURSES = [
  { firstName: 'Meena', lastName: 'Krishnan', email: 'meena.k@hospital.com', phone: '9800000001', ward: 'ICU', shift: 'Morning' },
  { firstName: 'Anjali', lastName: 'Desai', email: 'anjali.d@hospital.com', phone: '9800000002', ward: 'General', shift: 'Morning' },
  { firstName: 'Rekha', lastName: 'Iyer', email: 'rekha.i@hospital.com', phone: '9800000003', ward: 'Emergency', shift: 'Evening' },
  { firstName: 'Pooja', lastName: 'Mehta', email: 'pooja.m@hospital.com', phone: '9800000004', ward: 'Pediatric', shift: 'Evening' },
  { firstName: 'Kavitha', lastName: 'Rao', email: 'kavitha.r@hospital.com', phone: '9800000005', ward: 'Maternity', shift: 'Night' },
  { firstName: 'Divya', lastName: 'Pillai', email: 'divya.p@hospital.com', phone: '9800000006', ward: 'General', shift: 'Night' },
];

const PATIENTS = [
  { firstName: 'Ramesh', lastName: 'Kumar', gender: 'Male', dateOfBirth: new Date('1965-03-14'), phone: '9700000001', bloodGroup: 'B+', diagnosis: 'Hypertension' },
  { firstName: 'Lakshmi', lastName: 'Reddy', gender: 'Female', dateOfBirth: new Date('1972-07-22'), phone: '9700000002', bloodGroup: 'A+', diagnosis: 'Diabetes' },
  { firstName: 'Suresh', lastName: 'Nair', gender: 'Male', dateOfBirth: new Date('1958-11-08'), phone: '9700000003', bloodGroup: 'O+', diagnosis: 'Cardiac Arrhythmia' },
  { firstName: 'Geeta', lastName: 'Sharma', gender: 'Female', dateOfBirth: new Date('1980-05-30'), phone: '9700000004', bloodGroup: 'AB+', diagnosis: 'Migraine' },
  { firstName: 'Anil', lastName: 'Gupta', gender: 'Male', dateOfBirth: new Date('1990-09-15'), phone: '9700000005', bloodGroup: 'B-', diagnosis: 'Fracture' },
  { firstName: 'Sita', lastName: 'Pillai', gender: 'Female', dateOfBirth: new Date('1968-12-01'), phone: '9700000006', bloodGroup: 'A-', diagnosis: 'Asthma' },
  { firstName: 'Mohan', lastName: 'Das', gender: 'Male', dateOfBirth: new Date('1975-04-20'), phone: '9700000007', bloodGroup: 'O-', diagnosis: 'Appendicitis' },
  { firstName: 'Usha', lastName: 'Menon', gender: 'Female', dateOfBirth: new Date('1985-08-11'), phone: '9700000008', bloodGroup: 'AB-', diagnosis: 'Anemia' },
];

const BEDS = [
  // Patient beds
  { bedNumber: 'A-101', ward: 'General', status: 'Available', bedPurpose: 'patient_bed', occupantType: 'unoccupied' },
  { bedNumber: 'A-102', ward: 'General', status: 'Available', bedPurpose: 'patient_bed', occupantType: 'unoccupied' },
  { bedNumber: 'A-103', ward: 'General', status: 'Occupied', bedPurpose: 'patient_bed', occupantType: 'patient' },
  { bedNumber: 'A-104', ward: 'General', status: 'Maintenance', bedPurpose: 'patient_bed', occupantType: 'unoccupied' },
  { bedNumber: 'B-201', ward: 'Pediatric', status: 'Available', bedPurpose: 'patient_bed', occupantType: 'unoccupied' },
  { bedNumber: 'B-202', ward: 'Pediatric', status: 'Occupied', bedPurpose: 'patient_bed', occupantType: 'patient' },
  { bedNumber: 'B-203', ward: 'Pediatric', status: 'Available', bedPurpose: 'patient_bed', occupantType: 'unoccupied' },
  { bedNumber: 'C-301', ward: 'Maternity', status: 'Available', bedPurpose: 'patient_bed', occupantType: 'unoccupied' },
  { bedNumber: 'C-302', ward: 'Maternity', status: 'Occupied', bedPurpose: 'patient_bed', occupantType: 'patient' },
  { bedNumber: 'C-303', ward: 'Maternity', status: 'Available', bedPurpose: 'patient_bed', occupantType: 'unoccupied' },
  { bedNumber: 'D-401', ward: 'Emergency', status: 'Occupied', bedPurpose: 'patient_bed', occupantType: 'patient' },
  { bedNumber: 'D-402', ward: 'Emergency', status: 'Available', bedPurpose: 'patient_bed', occupantType: 'unoccupied' },
  { bedNumber: 'D-403', ward: 'Emergency', status: 'Maintenance', bedPurpose: 'patient_bed', occupantType: 'unoccupied' },
  { bedNumber: 'ICU-01', ward: 'ICU', status: 'Occupied', bedPurpose: 'patient_bed', occupantType: 'patient' },
  { bedNumber: 'ICU-02', ward: 'ICU', status: 'Occupied', bedPurpose: 'patient_bed', occupantType: 'patient' },
  { bedNumber: 'ICU-03', ward: 'ICU', status: 'Available', bedPurpose: 'patient_bed', occupantType: 'unoccupied' },
  { bedNumber: 'ICU-04', ward: 'ICU', status: 'Available', bedPurpose: 'patient_bed', occupantType: 'unoccupied' },
  { bedNumber: 'ICU-05', ward: 'ICU', status: 'Maintenance', bedPurpose: 'patient_bed', occupantType: 'unoccupied' },
  // Doctor rooms
  { bedNumber: 'DR-001', ward: 'Doctor Wing', status: 'Available', bedPurpose: 'doctor_room', occupantType: 'unoccupied' },
  { bedNumber: 'DR-002', ward: 'Doctor Wing', status: 'Available', bedPurpose: 'doctor_room', occupantType: 'unoccupied' },
  { bedNumber: 'DR-003', ward: 'Doctor Wing', status: 'Available', bedPurpose: 'doctor_room', occupantType: 'unoccupied' },
  { bedNumber: 'DR-004', ward: 'Doctor Wing', status: 'Available', bedPurpose: 'doctor_room', occupantType: 'unoccupied' },
  { bedNumber: 'DR-005', ward: 'Doctor Wing', status: 'Available', bedPurpose: 'doctor_room', occupantType: 'unoccupied' },
  // Nurse stations
  { bedNumber: 'NS-001', ward: 'Nurse Station', status: 'Available', bedPurpose: 'nurse_station', occupantType: 'unoccupied' },
  { bedNumber: 'NS-002', ward: 'Nurse Station', status: 'Available', bedPurpose: 'nurse_station', occupantType: 'unoccupied' },
  { bedNumber: 'NS-003', ward: 'Nurse Station', status: 'Available', bedPurpose: 'nurse_station', occupantType: 'unoccupied' },
  { bedNumber: 'NS-004', ward: 'Nurse Station', status: 'Available', bedPurpose: 'nurse_station', occupantType: 'unoccupied' },
  { bedNumber: 'NS-005', ward: 'Nurse Station', status: 'Available', bedPurpose: 'nurse_station', occupantType: 'unoccupied' },
  { bedNumber: 'NS-006', ward: 'Nurse Station', status: 'Available', bedPurpose: 'nurse_station', occupantType: 'unoccupied' },
];

const INSURANCE_POLICIES_DATA = [
  {
    policyNumber: 'SHI-2024-001', providerName: 'Star Health Insurance',
    coverageType: 'Premium', coverageAmount: 500000, usedAmount: 12000,
    startDate: new Date('2024-01-01'), expiryDate: new Date('2026-12-31'), status: 'active',
    coveredDiagnoses: ['Hypertension', 'Diabetes Type 2', 'Heart Disease', 'Chest Pain', 'Cardiac Arrest', 'Coronary Artery Disease']
  },
  {
    policyNumber: 'HDFC-2024-002', providerName: 'HDFC ERGO Health',
    coverageType: 'Standard', coverageAmount: 300000, usedAmount: 0,
    startDate: new Date('2024-06-01'), expiryDate: new Date('2026-05-31'), status: 'active',
    coveredDiagnoses: ['Migraine', 'Fever and Cough', 'Bronchitis', 'Appendicitis', 'Pneumonia', 'Typhoid']
  },
  {
    policyNumber: 'LIC-2024-003', providerName: 'LIC Health Plus',
    coverageType: 'Basic', coverageAmount: 100000, usedAmount: 45000,
    startDate: new Date('2024-04-01'), expiryDate: new Date('2025-03-31'), status: 'expired',
    coveredDiagnoses: ['Diabetes Type 2', 'Arthritis', 'Hypertension', 'Asthma']
  },
  {
    policyNumber: 'BA-2024-004', providerName: 'Bajaj Allianz Health',
    coverageType: 'Standard', coverageAmount: 250000, usedAmount: 0,
    startDate: new Date('2026-01-01'), expiryDate: new Date('2026-12-31'), status: 'active',
    coveredDiagnoses: ['Appendicitis', 'Fracture', 'Orthopedic Surgery', 'Sports Injury', 'Ligament Tear', 'Bone Fracture']
  },
  {
    policyNumber: 'NIA-2024-005', providerName: 'New India Assurance',
    coverageType: 'Premium', coverageAmount: 400000, usedAmount: 5000,
    startDate: new Date('2025-07-01'), expiryDate: new Date('2027-06-30'), status: 'active',
    coveredDiagnoses: ['Fracture', 'Arthritis', 'Orthopedics', 'Joint Replacement', 'Spine Surgery', 'Knee Surgery']
  },
  {
    policyNumber: 'CARE-2024-006', providerName: 'Care Health Insurance',
    coverageType: 'Premium', coverageAmount: 600000, usedAmount: 0,
    startDate: new Date('2025-01-01'), expiryDate: new Date('2027-12-31'), status: 'active',
    coveredDiagnoses: ['Cancer', 'Chemotherapy', 'Tumor', 'Oncology', 'Radiation Therapy', 'Blood Disorder']
  },
  {
    policyNumber: 'MAX-2024-007', providerName: 'Max Bupa Health',
    coverageType: 'Standard', coverageAmount: 350000, usedAmount: 20000,
    startDate: new Date('2024-09-01'), expiryDate: new Date('2026-08-31'), status: 'active',
    coveredDiagnoses: ['Kidney Disease', 'Dialysis', 'Renal Failure', 'Urinary Tract Infection', 'Kidney Stone']
  },
  {
    policyNumber: 'TATA-2024-008', providerName: 'Tata AIG Health',
    coverageType: 'Basic', coverageAmount: 150000, usedAmount: 0,
    startDate: new Date('2026-02-01'), expiryDate: new Date('2027-01-31'), status: 'active',
    coveredDiagnoses: ['Dengue', 'Malaria', 'Typhoid', 'Viral Fever', 'Chickenpox', 'Jaundice']
  },
  {
    policyNumber: 'ADITYA-2024-009', providerName: 'Aditya Birla Health',
    coverageType: 'Premium', coverageAmount: 1000000, usedAmount: 150000,
    startDate: new Date('2024-01-01'), expiryDate: new Date('2026-12-31'), status: 'active',
    coveredDiagnoses: ['Heart Surgery', 'Bypass Surgery', 'Angioplasty', 'Valve Replacement', 'Heart Attack', 'Hypertension', 'Chest Pain', 'Cardiac Arrest']
  },
  {
    policyNumber: 'NIVA-2024-010', providerName: 'Niva Bupa Health',
    coverageType: 'Standard', coverageAmount: 200000, usedAmount: 75000,
    startDate: new Date('2023-06-01'), expiryDate: new Date('2025-05-31'), status: 'suspended',
    coveredDiagnoses: ['Maternity', 'Pregnancy', 'Delivery', 'Newborn Care', 'Caesarean Section']
  },
];

const CLAIMS_DATA = [
  {
    claimId: 'CLM-20260301-AAA001', diagnosisCode: 'D001', diagnosisName: 'Hypertension',
    treatmentCode: 'T001', claimAmount: 15000, approvedAmount: 12000, patientLiability: 3000,
    fraudScore: 0.12, fraudReasons: [], status: 'approved', policyNumber: 'SHI-2024-001'
  },
  {
    claimId: 'CLM-20260305-BBB002', diagnosisCode: 'D002', diagnosisName: 'Migraine',
    treatmentCode: 'T002', claimAmount: 8000, approvedAmount: 0, patientLiability: 8000,
    fraudScore: 0.82, fraudReasons: ['Claim amount significantly above diagnosis average', 'Multiple claims within 7 days'],
    status: 'flagged', policyNumber: 'HDFC-2024-002'
  },
  {
    claimId: 'CLM-20260308-CCC003', diagnosisCode: 'D003', diagnosisName: 'Fracture',
    treatmentCode: 'T003', claimAmount: 35000, approvedAmount: 30000, patientLiability: 5000,
    fraudScore: 0.08, fraudReasons: [], status: 'approved', policyNumber: 'BA-2024-004'
  },
  {
    claimId: 'CLM-20260310-DDD004', diagnosisCode: 'D004', diagnosisName: 'Appendicitis',
    treatmentCode: 'T004', claimAmount: 45000, approvedAmount: 0, patientLiability: 45000,
    fraudScore: 0.55, fraudReasons: ['Claim amount above diagnosis average'],
    status: 'pending', policyNumber: 'HDFC-2024-002'
  },
  {
    claimId: 'CLM-20260315-EEE005', diagnosisCode: 'D005', diagnosisName: 'Chest Pain',
    treatmentCode: 'T005', claimAmount: 25000, approvedAmount: 0, patientLiability: 25000,
    fraudScore: 0.91, fraudReasons: ['Duplicate claim detected for same diagnosis', 'High claim frequency on this policy'],
    status: 'flagged', policyNumber: 'ADITYA-2024-009'
  },
  {
    claimId: 'CLM-20260317-FFF006', diagnosisCode: 'D006', diagnosisName: 'Fever and Cough',
    treatmentCode: 'T006', claimAmount: 5000, approvedAmount: 4500, patientLiability: 500,
    fraudScore: 0.05, fraudReasons: [], status: 'approved', policyNumber: 'TATA-2024-008'
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateDummyDepartment() {
  const existing = await Doctor.findOne({ department: { $ne: null } }).select('department');
  if (existing) return existing.department;
  return new mongoose.Types.ObjectId();
}

async function getOrCreateSystemUser() {
  let user = await User.findOne({ role: 'Administrator' });
  if (user) return user._id;
  const u = new User({
    name: 'System Seed',
    email: 'seed@system.internal',
    password: PLAIN_PASSWORD,
    role: 'Administrator',
  });
  await u.save();
  return u._id;
}

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function seedDoctors(departmentId, userId) {
  let created = 0;
  for (const d of DOCTORS) {
    const exists = await Doctor.findOne({ email: d.email });
    if (exists) continue;

    const userExists = await User.findOne({ email: d.email });
    let linkedUserId;
    if (userExists) {
      linkedUserId = userExists._id;
    } else {
      const u = new User({
        name: `${d.firstName} ${d.lastName}`,
        email: d.email,
        password: PLAIN_PASSWORD,
        role: 'Doctor',
      });
      await u.save();
      linkedUserId = u._id;
    }

    await new Doctor({
      ...d,
      department: departmentId,
      userId: linkedUserId,
      isSeeded: true,
      createdBy: userId,
    }).save();
    created++;
  }
  console.log(`  Doctors: ${created} created, ${DOCTORS.length - created} already existed`);
}

async function seedNurses(userId) {
  let created = 0;
  for (const n of NURSES) {
    const exists = await Nurse.findOne({ email: n.email });
    if (exists) continue;

    // Create User account for nurse login
    let nurseUser = await User.findOne({ email: n.email });
    if (!nurseUser) {
      nurseUser = new User({
        name: `${n.firstName} ${n.lastName}`,
        email: n.email,
        password: 'nurse123',
        role: 'Nurse',
        phone: n.phone,
        isActive: true,
      });
      await nurseUser.save();
    }

    await new Nurse({
      ...n,
      status: 'On Duty',
      experience: 3,
      maxPatientLoad: 5,
      isSeeded: true,
      createdBy: userId,
      userId: nurseUser._id,
    }).save();
    created++;
  }
  console.log(`  Nurses: ${created} created, ${NURSES.length - created} already existed`);
}

async function seedPatients(userId) {
  const ids = [];
  let created = 0;
  for (const p of PATIENTS) {
    const exists = await Patient.findOne({ phone: p.phone });
    if (exists) { ids.push(exists._id); continue; }
    const patient = await new Patient({
      firstName: p.firstName,
      lastName: p.lastName,
      gender: p.gender,
      dateOfBirth: p.dateOfBirth,
      phone: p.phone,
      bloodGroup: p.bloodGroup,
      medicalHistory: [{ condition: p.diagnosis, status: 'Active' }],
      isSeeded: true,
      createdBy: userId,
    }).save();
    ids.push(patient._id);
    created++;
  }
  console.log(`  Patients: ${created} created, ${PATIENTS.length - created} already existed`);
  return ids;
}

async function seedBeds(patientIds, userId) {
  const drCount = await Bed.countDocuments({ bedPurpose: 'doctor_room' });
  const nsCount = await Bed.countDocuments({ bedPurpose: 'nurse_station' });
  console.log(`  Found ${drCount} doctor rooms, ${nsCount} nurse stations in DB`);

  // Clear any corrupted allocatedTo.id values that were previously cast as ObjectId
  await Bed.updateMany(
    {},
    { $set: { 'allocatedTo.name': '', 'allocatedTo.role': '', 'allocatedTo.id': '', 'allocatedTo.department': '' } },
    { strict: false }
  );
  console.log('  Cleared allocatedTo fields on all beds');

  let created = 0;
  let patientIdx = 0;
  for (const b of BEDS) {
    const exists = await Bed.findOne({ bedNumber: b.bedNumber });
    if (exists) continue;

    const bedData = { ...b, isSeeded: true, createdBy: userId };
    if (b.bedPurpose === 'patient_bed' && b.status === 'Occupied' && patientIdx < patientIds.length) {
      bedData.patient = patientIds[patientIdx++];
      bedData.assignedDate = new Date();
    }

    await new Bed(bedData).save();
    created++;
  }
  console.log(`  Beds: ${created} created, ${BEDS.length - created} already existed`);
}

async function seedInsurancePolicies(patientIds) {
  let created = 0, skipped = 0;
  for (let i = 0; i < INSURANCE_POLICIES_DATA.length; i++) {
    const pol = INSURANCE_POLICIES_DATA[i];
    const exists = await InsurancePolicy.findOne({ policyNumber: pol.policyNumber });
    if (exists) { skipped++; continue; }
    const docData = { ...pol, isSeeded: true };
    // Link first N policies to patients where available
    if (i < patientIds.length) docData.patientId = patientIds[i];
    await new InsurancePolicy(docData).save();
    created++;
  }
  console.log(`  Insurance Policies: ${created} created, ${skipped} already existed`);
}

async function seedClaims(patientIds, doctorDocs) {
  console.log('\n  Seeding claims...');
  let created = 0, skipped = 0;
  for (let i = 0; i < CLAIMS_DATA.length; i++) {
    const claimData = CLAIMS_DATA[i];
    const patientId = patientIds[i % patientIds.length];
    const doctor = doctorDocs[i % doctorDocs.length];
    const policy = await InsurancePolicy.findOne({ policyNumber: claimData.policyNumber });
    if (!policy) {
      console.log(`    Skipping ${claimData.claimId} — policy ${claimData.policyNumber} not found`);
      continue;
    }
    const result = await Claim.findOneAndUpdate(
      { claimId: claimData.claimId },
      {
        $setOnInsert: {
          ...claimData,
          patientId,
          doctorId: doctor?._id,
          policyId: policy._id,
          claimDate: new Date(),
          isSeeded: true
        }
      },
      { upsert: true, new: false }
    );
    result ? skipped++ : created++;
  }
  console.log(`  Claims: ${created} created, ${skipped} already existed`);
}

async function seedBills(patientIds, userId) {
  const Bill = require('../models/Bill');

  const billTemplates = [
    {
      patientIdx: 0,
      items: [
        { description: 'General Ward (3 days)', quantity: 3, unitPrice: 1200, total: 3600 },
        { description: 'Registration Fee', quantity: 1, unitPrice: 500, total: 500 },
        { description: 'Doctor Consultation', quantity: 1, unitPrice: 800, total: 800 },
        { description: 'Nursing Charges (3 days)', quantity: 3, unitPrice: 400, total: 1200 },
        { description: 'Blood Test CBC', quantity: 1, unitPrice: 350, total: 350 },
      ],
    },
    {
      patientIdx: 1,
      items: [
        { description: 'Private Ward (2 days)', quantity: 2, unitPrice: 4000, total: 8000 },
        { description: 'Doctor Consultation', quantity: 2, unitPrice: 900, total: 1800 },
        { description: 'Nursing Charges (2 days)', quantity: 2, unitPrice: 400, total: 800 },
        { description: 'Urine Analysis', quantity: 1, unitPrice: 200, total: 200 },
        { description: 'Medication', quantity: 1, unitPrice: 1500, total: 1500 },
      ],
    },
    {
      patientIdx: 2,
      items: [
        { description: 'ICU (1 day)', quantity: 1, unitPrice: 8000, total: 8000 },
        { description: 'Doctor Consultation', quantity: 1, unitPrice: 800, total: 800 },
        { description: 'ECG', quantity: 1, unitPrice: 600, total: 600 },
        { description: 'Medication', quantity: 1, unitPrice: 2000, total: 2000 },
      ],
    },
    {
      patientIdx: 3,
      items: [
        { description: 'Outpatient Consultation', quantity: 1, unitPrice: 900, total: 900 },
        { description: 'MRI Scan', quantity: 1, unitPrice: 6000, total: 6000 },
        { description: 'Medication', quantity: 1, unitPrice: 800, total: 800 },
      ],
    },
    {
      patientIdx: 4,
      items: [
        { description: 'Minor Surgery', quantity: 1, unitPrice: 15000, total: 15000 },
        { description: 'General Ward (2 days)', quantity: 2, unitPrice: 1200, total: 2400 },
        { description: 'Nursing Charges (2 days)', quantity: 2, unitPrice: 400, total: 800 },
        { description: 'X-Ray', quantity: 1, unitPrice: 400, total: 400 },
        { description: 'Medication', quantity: 1, unitPrice: 1200, total: 1200 },
      ],
    },
  ];

  let created = 0;
  for (const tmpl of billTemplates) {
    if (tmpl.patientIdx >= patientIds.length) continue;
    const patientId = patientIds[tmpl.patientIdx];
    const exists = await Bill.findOne({ patient: patientId, notes: 'seeded' });
    if (exists) continue;

    const subtotal = tmpl.items.reduce((sum, i) => sum + i.total, 0);
    const tax = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + tax;

    await new Bill({
      patient: patientId,
      items: tmpl.items,
      subtotal,
      tax,
      totalAmount,
      paymentStatus: 'Pending',
      notes: 'seeded',
      createdBy: userId,
    }).save();
    created++;
  }
  console.log(`  Bills: ${created} created`);
}

async function seedAttendance(doctorDocs, nurseDocs) {
  console.log('\n  Seeding attendance records...');
  const Attendance = require('../models/Attendance');
  const today = new Date();
  let created = 0;

  for (const doctor of doctorDocs.slice(0, 3)) {
    const clockIn  = new Date(today); clockIn.setHours(9, 0, 0, 0);
    const clockOut = new Date(today); clockOut.setHours(17, 30, 0, 0);
    const startOfDay = new Date(today); startOfDay.setHours(0, 0, 0, 0);
    const result = await Attendance.findOneAndUpdate(
      { staff: doctor._id, date: { $gte: startOfDay } },
      {
        $setOnInsert: {
          staff: doctor._id,
          staffModel: 'Doctor',
          shift: 'Morning',
          clockIn: { time: clockIn },
          clockOut: { time: clockOut },
          totalHours: 8.5,
          status: 'Present',
          isSeeded: true,
        }
      },
      { upsert: true, new: false }
    );
    if (!result) created++;
  }

  for (const nurse of nurseDocs.slice(0, 4)) {
    const clockIn = new Date(today); clockIn.setHours(7, 0, 0, 0);
    const startOfDay = new Date(today); startOfDay.setHours(0, 0, 0, 0);
    const shift = nurse.shift === 'Morning' ? 'Morning' : nurse.shift === 'Evening' ? 'Evening' : 'Night';
    const result = await Attendance.findOneAndUpdate(
      { staff: nurse._id, date: { $gte: startOfDay } },
      {
        $setOnInsert: {
          staff: nurse._id,
          staffModel: 'Nurse',
          shift,
          clockIn: { time: clockIn },
          totalHours: 0,
          status: 'Present',
          isSeeded: true,
        }
      },
      { upsert: true, new: false }
    );
    if (!result) created++;
  }

  console.log(`  Attendance: ${created} records created`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Hospital Seed Script ===\n');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  const departmentId = await getOrCreateDummyDepartment();
  const userId = await getOrCreateSystemUser();

  await seedDoctors(departmentId, userId);
  await seedNurses(userId);
  const patientIds = await seedPatients(userId);
  await seedBeds(patientIds, userId);
  await seedInsurancePolicies(patientIds);
  await seedBills(patientIds, userId);

  const doctors = await Doctor.find().limit(6);
  const nurses  = await Nurse.find().limit(6);
  await seedClaims(patientIds, doctors);
  await seedAttendance(doctors, nurses);

  console.log('\n=== Seed complete ===\n');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
