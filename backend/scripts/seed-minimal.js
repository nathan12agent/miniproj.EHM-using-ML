const mongoose = require('mongoose');
const User = require('../models/User');
const Nurse = require('../models/Nurse');
const Bed = require('../models/Bed');
require('dotenv').config();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
  console.log('Connected to MongoDB');

  // Clear everything
  await User.deleteMany({});
  await Nurse.deleteMany({});
  await Bed.deleteMany({});
  console.log('Collections cleared');

  // Create admin
  const admin = await User.create({
    name: 'Dr. Admin',
    email: 'admin@hospital.com',
    password: 'admin123',
    role: 'Administrator',
    phone: '+1234567890',
    department: 'Administration'
  });
  console.log('Admin created:', admin.email);

  // Nurse data with matching User accounts
  const nurseData = [
    { firstName:'Sarah', lastName:'Johnson', email:'sarah.j@hospital.com', phone:'+11000001', ward:'ICU', shift:'Morning', status:'On Duty', experience:8, workingHours:8, maxPatientLoad:4 },
    { firstName:'Emily', lastName:'Davis', email:'emily.d@hospital.com', phone:'+11000002', ward:'General', shift:'Morning', status:'On Duty', experience:5, workingHours:8, maxPatientLoad:6 },
    { firstName:'Lisa', lastName:'Anderson', email:'lisa.a@hospital.com', phone:'+11000003', ward:'Emergency', shift:'Morning', status:'On Duty', experience:10, workingHours:12, maxPatientLoad:5 },
    { firstName:'Michael', lastName:'Chen', email:'michael.c@hospital.com', phone:'+11000004', ward:'ICU', shift:'Evening', status:'On Duty', experience:6, workingHours:12, maxPatientLoad:5 },
    { firstName:'James', lastName:'Wilson', email:'james.w@hospital.com', phone:'+11000005', ward:'General', shift:'Evening', status:'On Break', experience:4, workingHours:8, maxPatientLoad:5 },
  ];

  for (const nd of nurseData) {
    // Create User account for the nurse
    const nurseUser = await User.create({
      name: `${nd.firstName} ${nd.lastName}`,
      email: nd.email,
      password: 'nurse123',
      role: 'Nurse',
      phone: nd.phone
    });

    // Create Nurse profile linked to User
    await new Nurse({ ...nd, userId: nurseUser._id, createdBy: admin._id }).save();
    await sleep(5); // ensure unique Date.now() for nurseId
  }
  console.log('Nurses created with User accounts:', nurseData.length);

  // Create beds
  const bedData = [];
  [['ICU',6], ['General',10], ['Emergency',8], ['Pediatric',4], ['Maternity',4]].forEach(([ward, count]) => {
    for (let i = 1; i <= count; i++) {
      bedData.push({ bedNumber: `${ward.slice(0,3).toUpperCase()}-${String(i).padStart(3,'0')}`, ward, status: i <= 2 ? 'Occupied' : 'Available', createdBy: admin._id });
    }
  });
  await Bed.insertMany(bedData);
  console.log('Beds created:', bedData.length);

  console.log('\n✅ Database seeded!');
  console.log('\n📋 Login Credentials:');
  console.log('─────────────────────────────');
  console.log('Admin:  admin@hospital.com / admin123');
  console.log('─────────────────────────────');
  console.log('Nurses (all use password: nurse123):');
  nurseData.forEach(n => console.log(`  ${n.firstName} ${n.lastName}: ${n.email}`));
  process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });
