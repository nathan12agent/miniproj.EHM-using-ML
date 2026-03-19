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
    department: null, // filled below
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

// 18 beds across wards
const BEDS = [
  // Ward A (General) — 4 beds
  { bedNumber: 'A-101', ward: 'General', status: 'Available' },
  { bedNumber: 'A-102', ward: 'General', status: 'Available' },
  { bedNumber: 'A-103', ward: 'General', status: 'Occupied' },
  { bedNumber: 'A-104', ward: 'General', status: 'Maintenance' },
  // Ward B (Pediatric) — 3 beds
  { bedNumber: 'B-201', ward: 'Pediatric', status: 'Available' },
  { bedNumber: 'B-202', ward: 'Pediatric', status: 'Occupied' },
  { bedNumber: 'B-203', ward: 'Pediatric', status: 'Available' },
  // Ward C (Maternity) — 3 beds
  { bedNumber: 'C-301', ward: 'Maternity', status: 'Available' },
  { bedNumber: 'C-302', ward: 'Maternity', status: 'Occupied' },
  { bedNumber: 'C-303', ward: 'Maternity', status: 'Available' },
  // Ward D (Emergency) — 3 beds
  { bedNumber: 'D-401', ward: 'Emergency', status: 'Occupied' },
  { bedNumber: 'D-402', ward: 'Emergency', status: 'Available' },
  { bedNumber: 'D-403', ward: 'Emergency', status: 'Maintenance' },
  // ICU — 5 beds
  { bedNumber: 'ICU-01', ward: 'ICU', status: 'Occupied' },
  { bedNumber: 'ICU-02', ward: 'ICU', status: 'Occupied' },
  { bedNumber: 'ICU-03', ward: 'ICU', status: 'Available' },
  { bedNumber: 'ICU-04', ward: 'ICU', status: 'Available' },
  { bedNumber: 'ICU-05', ward: 'ICU', status: 'Maintenance' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateDummyDepartment() {
  // Doctor model requires a department ObjectId — use a placeholder
  // Try to find any existing ObjectId in the DB, or create a fake one
  const existing = await Doctor.findOne({ department: { $ne: null } }).select('department');
  if (existing) return existing.department;
  // Return a valid-looking ObjectId as placeholder
  return new mongoose.Types.ObjectId();
}

async function getOrCreateSystemUser() {
  let user = await User.findOne({ role: 'Administrator' });
  if (user) return user._id;
  // Create a minimal system user if none exists
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

    // Create linked User account
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
    await new Nurse({
      ...n,
      status: 'On Duty',
      experience: 3,
      maxPatientLoad: 5,
      isSeeded: true,
      createdBy: userId,
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
  let created = 0;
  let patientIdx = 0;
  for (const b of BEDS) {
    const exists = await Bed.findOne({ bedNumber: b.bedNumber });
    if (exists) continue;

    const bedData = {
      ...b,
      isSeeded: true,
      createdBy: userId,
    };

    // Assign a patient to occupied beds
    if (b.status === 'Occupied' && patientIdx < patientIds.length) {
      bedData.patient = patientIds[patientIdx++];
      bedData.assignedDate = new Date();
    }

    await new Bed(bedData).save();
    created++;
  }
  console.log(`  Beds: ${created} created, ${BEDS.length - created} already existed`);
}

async function seedInsurancePolicies(patientIds, userId) {
  const policies = [
    { idx: 0, provider: 'Star Health Insurance', policyNumber: 'SHI-2024-001', coverageType: 'Premium', coverageAmount: 500000 },
    { idx: 1, provider: 'HDFC Ergo', policyNumber: 'HE-2024-002', coverageType: 'Standard', coverageAmount: 300000 },
    { idx: 2, provider: 'ICICI Lombard', policyNumber: 'IL-2024-003', coverageType: 'Comprehensive', coverageAmount: 1000000 },
    { idx: 3, provider: 'Bajaj Allianz', policyNumber: 'BA-2024-004', coverageType: 'Basic', coverageAmount: 100000 },
    { idx: 4, provider: 'New India Assurance', policyNumber: 'NIA-2024-005', coverageType: 'Standard', coverageAmount: 200000 },
  ];

  let created = 0;
  for (const pol of policies) {
    if (pol.idx >= patientIds.length) continue;
    const exists = await InsurancePolicy.findOne({ policyNumber: pol.policyNumber });
    if (exists) continue;

    await new InsurancePolicy({
      patientId: patientIds[pol.idx],
      providerName: pol.provider,
      policyNumber: pol.policyNumber,
      coverageType: pol.coverageType,
      coverageAmount: pol.coverageAmount,
      startDate: new Date('2024-01-01'),
      expiryDate: new Date('2026-12-31'),
      coveredDiagnoses: ['D001', 'D002', 'D003', 'D004', 'D005'],
      isSeeded: true,
    }).save();
    created++;
  }
  console.log(`  Insurance Policies: ${created} created, ${policies.length - created} already existed`);
}

async function seedBills(patientIds, userId) {
  const Bill = require('../models/Bill');

  // Realistic bill templates — all amounts in rupees
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

    // Check if a seeded bill already exists for this patient
    const exists = await Bill.findOne({ patient: patientId, notes: 'seeded' });
    if (exists) continue;

    const subtotal = tmpl.items.reduce((sum, i) => sum + i.total, 0);
    const tax = Math.round(subtotal * 0.18); // 18% GST
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
  await seedInsurancePolicies(patientIds, userId);
  await seedBills(patientIds, userId);

  console.log('\n=== Seed complete ===\n');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
