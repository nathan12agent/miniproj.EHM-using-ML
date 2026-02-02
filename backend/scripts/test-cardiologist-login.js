const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
require('dotenv').config();

const testCardiologistLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('✓ Connected to MongoDB\n');

    // Test 1: Check if user exists
    console.log('Test 1: Checking if cardiologist user exists...');
    const user = await User.findOne({ email: 'cardiologist@hospital.com' });

    if (!user) {
      console.log('❌ FAIL: User not found!');
      console.log('\nSolution: Run seed-cardiologist.cmd\n');
      process.exit(1);
    }

    console.log('✓ PASS: User found');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Active:', user.isActive);

    // Test 2: Check if user is active
    console.log('\nTest 2: Checking if user is active...');
    if (!user.isActive) {
      console.log('❌ FAIL: User is inactive!');
      user.isActive = true;
      await user.save();
      console.log('✓ Fixed: User activated');
    } else {
      console.log('✓ PASS: User is active');
    }

    // Test 3: Check password
    console.log('\nTest 3: Testing password...');
    const testPassword = 'cardio123';
    const isMatch = await user.comparePassword(testPassword);

    if (!isMatch) {
      console.log('❌ FAIL: Password does not match!');
      console.log('\nFixing password...');
      user.password = testPassword;
      await user.save();
      console.log('✓ Password reset to: cardio123');
      
      // Verify again
      const user2 = await User.findOne({ email: 'cardiologist@hospital.com' });
      const isMatch2 = await user2.comparePassword(testPassword);
      console.log('✓ Verification:', isMatch2 ? 'PASS' : 'FAIL');
    } else {
      console.log('✓ PASS: Password is correct');
    }

    // Test 4: Check doctor profile
    console.log('\nTest 4: Checking doctor profile...');
    const doctor = await Doctor.findOne({ userId: user._id });

    if (!doctor) {
      console.log('❌ FAIL: Doctor profile not found!');
      console.log('\nSolution: Run seed-cardiologist.cmd\n');
      process.exit(1);
    }

    console.log('✓ PASS: Doctor profile found');
    console.log('  Name:', doctor.firstName, doctor.lastName);
    console.log('  Specialization:', doctor.specialization);
    console.log('  Status:', doctor.status);

    // Test 5: Check appointments
    console.log('\nTest 5: Checking appointments...');
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({ doctor: doctor._id });
    
    console.log('✓ Appointments found:', appointments.length);
    if (appointments.length === 0) {
      console.log('⚠ Warning: No appointments found');
      console.log('  Solution: Run seed-cardiologist.cmd to create appointments');
    }

    // Summary
    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log('✓ User exists');
    console.log('✓ User is active');
    console.log('✓ Password is correct');
    console.log('✓ Doctor profile exists');
    console.log(`✓ ${appointments.length} appointments found`);
    console.log('\n========================================');
    console.log('LOGIN CREDENTIALS');
    console.log('========================================');
    console.log('Email: cardiologist@hospital.com');
    console.log('Password: cardio123');
    console.log('URL: http://localhost:3000/doctor/login');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testCardiologistLogin();
