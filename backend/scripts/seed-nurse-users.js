// backend/scripts/seed-nurse-users.js
// Creates User accounts (role: 'Nurse') for all existing Nurse records that lack one.
// Run once: node scripts/seed-nurse-users.js
// Default password: nurse123

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Nurse = require('../models/Nurse');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management';
const DEFAULT_PASSWORD = 'nurse123';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  const nurses = await Nurse.find({});
  console.log(`Found ${nurses.length} nurse(s)\n`);

  let created = 0, linked = 0, skipped = 0;

  for (const nurse of nurses) {
    // Already has a userId linked
    if (nurse.userId) {
      const existingUser = await User.findById(nurse.userId);
      if (existingUser) { skipped++; continue; }
    }

    // Check if a User with this email already exists
    let user = await User.findOne({ email: nurse.email });

    if (!user) {
      user = new User({
        name: `${nurse.firstName} ${nurse.lastName}`,
        email: nurse.email,
        password: DEFAULT_PASSWORD,
        role: 'Nurse',
        phone: nurse.phone,
        isActive: true,
      });
      await user.save();
      created++;
      console.log(`  ✅ Created user: ${nurse.email}`);
    } else if (user.role !== 'Nurse') {
      user.role = 'Nurse';
      await user.save();
      console.log(`  🔄 Updated role to Nurse: ${nurse.email}`);
      linked++;
    } else {
      linked++;
      console.log(`  ℹ️  User already exists: ${nurse.email}`);
    }

    // Link userId on Nurse record
    nurse.userId = user._id;
    await nurse.save();
  }

  console.log(`\n=== Done ===`);
  console.log(`  Created: ${created} | Linked: ${linked} | Skipped: ${skipped}`);
  console.log(`\nAll nurses can now log in with password: ${DEFAULT_PASSWORD}`);
  console.log('Nurse emails:');
  nurses.forEach(n => console.log(`  ${n.email}`));

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
