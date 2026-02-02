const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const fixPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      phone: String,
      department: String,
      isActive: Boolean
    }, { timestamps: true }));

    const email = 'admin@hospital.com';
    const newPassword = 'admin123';

    console.log('\n🔧 Fixing admin password...');
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found! Creating new admin user...');
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await User.create({
        name: 'Dr. Admin',
        email: 'admin@hospital.com',
        password: hashedPassword,
        role: 'Administrator',
        phone: '+1234567890',
        department: 'Administration',
        isActive: true
      });
      
      console.log('✅ New admin user created!');
    } else {
      console.log('✅ User found, updating password...');
      
      // Hash the password manually
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update directly without triggering pre-save hook
      await User.updateOne(
        { email },
        { $set: { password: hashedPassword } }
      );
      
      console.log('✅ Password updated!');
    }

    // Test the password
    console.log('\n🔍 Testing new password...');
    const updatedUser = await User.findOne({ email });
    const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
    
    if (isMatch) {
      console.log('✅ Password test PASSED!');
      console.log('\nYou can now login with:');
      console.log('Email: admin@hospital.com');
      console.log('Password: admin123');
    } else {
      console.log('❌ Password test FAILED!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixPassword();
