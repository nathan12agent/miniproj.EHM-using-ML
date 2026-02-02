const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const fixCardiologistPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('Connected to MongoDB');

    // Find cardiologist user
    const user = await User.findOne({ email: 'cardiologist@hospital.com' });

    if (!user) {
      console.log('❌ Cardiologist user not found!');
      console.log('Run: seed-cardiologist.cmd first');
      process.exit(1);
    }

    console.log('✓ Found cardiologist user');
    console.log('Current user:', {
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Hash new password
    const newPassword = 'cardio123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log('\n✓ Password updated successfully!');
    console.log('\n========================================');
    console.log('Login credentials:');
    console.log('Email: cardiologist@hospital.com');
    console.log('Password: cardio123');
    console.log('========================================\n');

    // Test the password
    const isMatch = await bcrypt.compare(newPassword, user.password);
    console.log('Password verification:', isMatch ? '✓ PASS' : '✗ FAIL');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixCardiologistPassword();
