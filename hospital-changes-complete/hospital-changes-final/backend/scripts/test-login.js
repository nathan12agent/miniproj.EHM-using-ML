const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('Connected to MongoDB');

    const email = 'admin@hospital.com';
    const password = 'admin123';

    console.log('\n🔍 Testing login credentials...');
    console.log('Email:', email);
    console.log('Password:', password);

    const user = await User.findOne({ email });

    if (!user) {
      console.log('\n❌ User not found!');
      console.log('Please run the seed script: npm run seed');
      process.exit(1);
    }

    console.log('\n✅ User found in database');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);

    const isMatch = await user.comparePassword(password);

    if (isMatch) {
      console.log('\n✅ Password is correct!');
      console.log('\nYou can login with:');
      console.log('Email: admin@hospital.com');
      console.log('Password: admin123');
    } else {
      console.log('\n❌ Password is incorrect!');
      console.log('The password in the database does not match "admin123"');
      console.log('\nPlease re-run the seed script to reset the password:');
      console.log('npm run seed');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testLogin();
