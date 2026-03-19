// Run once: node scripts/create-admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: 'admin@hospital.com' });
  if (existing) {
    console.log('Admin user already exists:', existing.email, '| role:', existing.role);
    await mongoose.disconnect();
    process.exit(0);
  }

  const admin = new User({
    name: 'Hospital Admin',
    email: 'admin@hospital.com',
    password: 'admin123',
    role: 'Administrator',
    isActive: true,
  });

  await admin.save();
  console.log('Admin user created successfully');
  console.log('  Email:    admin@hospital.com');
  console.log('  Password: admin123');
  console.log('  Role:     Administrator');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
