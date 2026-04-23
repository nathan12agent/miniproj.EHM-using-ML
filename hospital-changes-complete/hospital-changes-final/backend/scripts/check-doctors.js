require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

async function checkDoctors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const doctors = await Doctor.find({});
    
    console.log(`Found ${doctors.length} doctors:\n`);
    
    doctors.forEach((doc, index) => {
      console.log(`${index + 1}. Dr. ${doc.firstName} ${doc.lastName}`);
      console.log(`   Specialization: ${doc.specialization}`);
      console.log(`   ID: ${doc._id}`);
      console.log(`   Has Schedule: ${doc.schedule ? 'Yes' : 'No'}`);
      if (doc.schedule && doc.schedule.monday) {
        console.log(`   Monday: ${doc.schedule.monday.isAvailable ? doc.schedule.monday.startTime + ' - ' + doc.schedule.monday.endTime : 'Not available'}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkDoctors();
