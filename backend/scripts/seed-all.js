const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Nurse = require('../models/Nurse');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');

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

async function seedAll() {
  try {
    console.log('\n🌱 Starting complete database seeding...\n');
    console.log('This will add nurses, beds, and patients to the database.\n');

    // Run individual seed scripts
    console.log('📋 Step 1/2: Seeding nurses and beds...');
    await require('./seed-nurses-beds');
    
    console.log('\n📋 Step 2/2: Seeding patients...');
    await require('./seed-patients');

    console.log('\n✅ Complete database seeding finished!\n');
    console.log('Your database now has:');
    console.log('   - 20 Nurses (ICU, General, Emergency)');
    console.log('   - 20 Beds (ICU, General, Emergency, Pediatric)');
    console.log('   - 10 Patients (various conditions)');
    console.log('\nReady for auto-assignment testing! 🚀\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedAll();
}

module.exports = seedAll;
