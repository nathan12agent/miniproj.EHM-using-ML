const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Nurse = require('../models/Nurse');
const Bed = require('../models/Bed');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Nurse data for auto-assignment
const nursesData = [
  // ICU Nurses (5)
  {
    nurseId: 'N00000101',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@hospital.com',
    phone: '555-0101',
    specialization: 'Critical Care',
    ward: 'ICU',
    shift: 'Morning',
    status: 'On Duty',
    experience: 8,
    maxPatientLoad: 4,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000102',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@hospital.com',
    phone: '555-0102',
    specialization: 'Critical Care',
    ward: 'ICU',
    shift: 'Evening',
    status: 'On Duty',
    experience: 6,
    maxPatientLoad: 4,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000103',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@hospital.com',
    phone: '555-0103',
    specialization: 'Critical Care',
    ward: 'ICU',
    shift: 'Night',
    status: 'On Duty',
    experience: 10,
    maxPatientLoad: 4,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000104',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@hospital.com',
    phone: '555-0104',
    specialization: 'Critical Care',
    ward: 'ICU',
    shift: 'Morning',
    status: 'On Duty',
    experience: 5,
    maxPatientLoad: 4,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000105',
    firstName: 'Lisa',
    lastName: 'Thompson',
    email: 'lisa.thompson@hospital.com',
    phone: '555-0105',
    specialization: 'Critical Care',
    ward: 'ICU',
    shift: 'Evening',
    status: 'On Duty',
    experience: 7,
    maxPatientLoad: 4,
    workingHours: 8,
    assignedPatients: [],
  },

  // General Ward Nurses (8)
  {
    nurseId: 'N00000106',
    firstName: 'Jennifer',
    lastName: 'Martinez',
    email: 'jennifer.martinez@hospital.com',
    phone: '555-0106',
    specialization: 'General Nursing',
    ward: 'General',
    shift: 'Morning',
    status: 'On Duty',
    experience: 4,
    maxPatientLoad: 6,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000107',
    firstName: 'Robert',
    lastName: 'Wilson',
    email: 'robert.wilson@hospital.com',
    phone: '555-0107',
    specialization: 'General Nursing',
    ward: 'General',
    shift: 'Evening',
    status: 'On Duty',
    experience: 6,
    maxPatientLoad: 6,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000108',
    firstName: 'Amanda',
    lastName: 'Brown',
    email: 'amanda.brown@hospital.com',
    phone: '555-0108',
    specialization: 'General Nursing',
    ward: 'General',
    shift: 'Night',
    status: 'On Duty',
    experience: 5,
    maxPatientLoad: 6,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000109',
    firstName: 'James',
    lastName: 'Taylor',
    email: 'james.taylor@hospital.com',
    phone: '555-0109',
    specialization: 'General Nursing',
    ward: 'General',
    shift: 'Morning',
    status: 'On Duty',
    experience: 3,
    maxPatientLoad: 6,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000110',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@hospital.com',
    phone: '555-0110',
    specialization: 'General Nursing',
    ward: 'General',
    shift: 'Evening',
    status: 'On Duty',
    experience: 7,
    maxPatientLoad: 6,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000111',
    firstName: 'Christopher',
    lastName: 'Lee',
    email: 'christopher.lee@hospital.com',
    phone: '555-0111',
    specialization: 'General Nursing',
    ward: 'General',
    shift: 'Night',
    status: 'On Duty',
    experience: 4,
    maxPatientLoad: 6,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000112',
    firstName: 'Patricia',
    lastName: 'Anderson',
    email: 'patricia.anderson@hospital.com',
    phone: '555-0112',
    specialization: 'General Nursing',
    ward: 'General',
    shift: 'Morning',
    status: 'On Duty',
    experience: 9,
    maxPatientLoad: 6,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000113',
    firstName: 'Daniel',
    lastName: 'White',
    email: 'daniel.white@hospital.com',
    phone: '555-0113',
    specialization: 'General Nursing',
    ward: 'General',
    shift: 'Evening',
    status: 'On Duty',
    experience: 5,
    maxPatientLoad: 6,
    workingHours: 8,
    assignedPatients: [],
  },

  // Emergency Nurses (4)
  {
    nurseId: 'N00000114',
    firstName: 'Jessica',
    lastName: 'Harris',
    email: 'jessica.harris@hospital.com',
    phone: '555-0114',
    specialization: 'Emergency Care',
    ward: 'Emergency',
    shift: 'Morning',
    status: 'On Duty',
    experience: 6,
    maxPatientLoad: 5,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000115',
    firstName: 'Matthew',
    lastName: 'Clark',
    email: 'matthew.clark@hospital.com',
    phone: '555-0115',
    specialization: 'Emergency Care',
    ward: 'Emergency',
    shift: 'Evening',
    status: 'On Duty',
    experience: 8,
    maxPatientLoad: 5,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000116',
    firstName: 'Ashley',
    lastName: 'Lewis',
    email: 'ashley.lewis@hospital.com',
    phone: '555-0116',
    specialization: 'Emergency Care',
    ward: 'Emergency',
    shift: 'Night',
    status: 'On Duty',
    experience: 7,
    maxPatientLoad: 5,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000117',
    firstName: 'Kevin',
    lastName: 'Walker',
    email: 'kevin.walker@hospital.com',
    phone: '555-0117',
    specialization: 'Emergency Care',
    ward: 'Emergency',
    shift: 'Morning',
    status: 'On Duty',
    experience: 5,
    maxPatientLoad: 5,
    workingHours: 8,
    assignedPatients: [],
  },

  // ICU Additional Nurses (3 more for better coverage)
  {
    nurseId: 'N00000118',
    firstName: 'Nicole',
    lastName: 'Hall',
    email: 'nicole.hall@hospital.com',
    phone: '555-0118',
    specialization: 'Critical Care',
    ward: 'ICU',
    shift: 'Morning',
    status: 'On Duty',
    experience: 9,
    maxPatientLoad: 4,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000119',
    firstName: 'Brian',
    lastName: 'Young',
    email: 'brian.young@hospital.com',
    phone: '555-0119',
    specialization: 'Critical Care',
    ward: 'ICU',
    shift: 'Evening',
    status: 'On Duty',
    experience: 7,
    maxPatientLoad: 4,
    workingHours: 8,
    assignedPatients: [],
  },
  {
    nurseId: 'N00000120',
    firstName: 'Stephanie',
    lastName: 'King',
    email: 'stephanie.king@hospital.com',
    phone: '555-0120',
    specialization: 'Critical Care',
    ward: 'ICU',
    shift: 'Night',
    status: 'On Duty',
    experience: 6,
    maxPatientLoad: 4,
    workingHours: 8,
    assignedPatients: [],
  },
];

// Bed data for auto-assignment
const bedsData = [
  // ICU Beds (5)
  { bedNumber: 'ICU-101', ward: 'ICU', floor: 3, status: 'Available', bedType: 'ICU', features: ['Ventilator', 'Cardiac Monitor', 'IV Pump'] },
  { bedNumber: 'ICU-102', ward: 'ICU', floor: 3, status: 'Available', bedType: 'ICU', features: ['Ventilator', 'Cardiac Monitor', 'IV Pump'] },
  { bedNumber: 'ICU-103', ward: 'ICU', floor: 3, status: 'Available', bedType: 'ICU', features: ['Ventilator', 'Cardiac Monitor', 'IV Pump'] },
  { bedNumber: 'ICU-104', ward: 'ICU', floor: 3, status: 'Occupied', bedType: 'ICU', features: ['Ventilator', 'Cardiac Monitor', 'IV Pump'] },
  { bedNumber: 'ICU-105', ward: 'ICU', floor: 3, status: 'Available', bedType: 'ICU', features: ['Ventilator', 'Cardiac Monitor', 'IV Pump'] },

  // General Ward Beds (10)
  { bedNumber: 'GEN-201', ward: 'General', floor: 2, status: 'Available', bedType: 'Standard', features: ['Oxygen', 'Call Button'] },
  { bedNumber: 'GEN-202', ward: 'General', floor: 2, status: 'Available', bedType: 'Standard', features: ['Oxygen', 'Call Button'] },
  { bedNumber: 'GEN-203', ward: 'General', floor: 2, status: 'Occupied', bedType: 'Standard', features: ['Oxygen', 'Call Button'] },
  { bedNumber: 'GEN-204', ward: 'General', floor: 2, status: 'Available', bedType: 'Standard', features: ['Oxygen', 'Call Button'] },
  { bedNumber: 'GEN-205', ward: 'General', floor: 2, status: 'Available', bedType: 'Standard', features: ['Oxygen', 'Call Button'] },
  { bedNumber: 'GEN-206', ward: 'General', floor: 2, status: 'Occupied', bedType: 'Standard', features: ['Oxygen', 'Call Button'] },
  { bedNumber: 'GEN-207', ward: 'General', floor: 2, status: 'Available', bedType: 'Standard', features: ['Oxygen', 'Call Button'] },
  { bedNumber: 'GEN-208', ward: 'General', floor: 2, status: 'Available', bedType: 'Standard', features: ['Oxygen', 'Call Button'] },
  { bedNumber: 'GEN-209', ward: 'General', floor: 2, status: 'Available', bedType: 'Standard', features: ['Oxygen', 'Call Button'] },
  { bedNumber: 'GEN-210', ward: 'General', floor: 2, status: 'Available', bedType: 'Standard', features: ['Oxygen', 'Call Button'] },

  // Emergency Beds (3)
  { bedNumber: 'ER-001', ward: 'Emergency', floor: 1, status: 'Available', bedType: 'Emergency', features: ['Trauma Cart', 'Defibrillator', 'Oxygen'] },
  { bedNumber: 'ER-002', ward: 'Emergency', floor: 1, status: 'Occupied', bedType: 'Emergency', features: ['Trauma Cart', 'Defibrillator', 'Oxygen'] },
  { bedNumber: 'ER-003', ward: 'Emergency', floor: 1, status: 'Available', bedType: 'Emergency', features: ['Trauma Cart', 'Defibrillator', 'Oxygen'] },

  // Pediatric Beds (2)
  { bedNumber: 'PED-401', ward: 'Pediatric', floor: 4, status: 'Available', bedType: 'Pediatric', features: ['Pediatric Monitor', 'Oxygen', 'Call Button'] },
  { bedNumber: 'PED-402', ward: 'Pediatric', floor: 4, status: 'Available', bedType: 'Pediatric', features: ['Pediatric Monitor', 'Oxygen', 'Call Button'] },
];

async function seedDatabase() {
  try {
    console.log('\n🌱 Starting database seeding...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing nurses and beds...');
    await Nurse.deleteMany({});
    await Bed.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Insert nurses
    console.log('👩‍⚕️ Inserting nurses...');
    const nurses = await Nurse.insertMany(nursesData);
    console.log(`✅ Inserted ${nurses.length} nurses\n`);

    // Insert beds
    console.log('🛏️  Inserting beds...');
    const beds = await Bed.insertMany(bedsData);
    console.log(`✅ Inserted ${beds.length} beds\n`);

    // Summary
    console.log('📊 SEEDING SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`👩‍⚕️ Nurses: ${nurses.length}`);
    console.log('   - ICU: 5');
    console.log('   - General Ward: 8');
    console.log('   - Emergency: 4');
    console.log('   - Cardiology: 3');
    console.log('');
    console.log(`🛏️  Beds: ${beds.length}`);
    console.log('   - ICU: 5 (4 available, 1 occupied)');
    console.log('   - General: 10 (8 available, 2 occupied)');
    console.log('   - Emergency: 3 (2 available, 1 occupied)');
    console.log('   - Cardiology: 2 (2 available)');
    console.log('');
    console.log(`✅ Total Available Beds: ${beds.filter(b => b.status === 'Available').length}`);
    console.log(`⚠️  Total Occupied Beds: ${beds.filter(b => b.status === 'Occupied').length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('✅ Database seeding completed successfully!\n');
    console.log('You can now use the auto-assignment ML features.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
