/**
 * Migration Script: Add Schedule Fields to Existing Doctors
 * 
 * This script updates all existing doctors in the database to include
 * the new schedule fields with sensible defaults.
 */

const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Default schedule template
const defaultSchedule = {
  monday: {
    isAvailable: true,
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    breakTimes: [
      { startTime: '12:00', endTime: '13:00' }
    ]
  },
  tuesday: {
    isAvailable: true,
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    breakTimes: [
      { startTime: '12:00', endTime: '13:00' }
    ]
  },
  wednesday: {
    isAvailable: true,
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    breakTimes: [
      { startTime: '12:00', endTime: '13:00' }
    ]
  },
  thursday: {
    isAvailable: true,
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    breakTimes: [
      { startTime: '12:00', endTime: '13:00' }
    ]
  },
  friday: {
    isAvailable: true,
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    breakTimes: [
      { startTime: '12:00', endTime: '13:00' }
    ]
  },
  saturday: {
    isAvailable: false,
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: 30,
    breakTimes: []
  },
  sunday: {
    isAvailable: false,
    startTime: '',
    endTime: '',
    slotDuration: 30,
    breakTimes: []
  }
};

async function migrateSchedules() {
  try {
    console.log('🚀 Starting doctor schedule migration...\n');

    // Find all doctors
    const doctors = await Doctor.find({});
    console.log(`Found ${doctors.length} doctors in database\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const doctor of doctors) {
      // Check if doctor already has the new schedule structure
      const hasNewSchedule = doctor.schedule?.monday?.slotDuration !== undefined;

      if (hasNewSchedule) {
        console.log(`⏭️  Skipping ${doctor.fullName} - already has new schedule structure`);
        skippedCount++;
        continue;
      }

      // Merge existing schedule with new fields
      const updatedSchedule = {};
      
      for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
        const existingDaySchedule = doctor.schedule?.[day] || {};
        const defaultDaySchedule = defaultSchedule[day];

        updatedSchedule[day] = {
          isAvailable: existingDaySchedule.isAvailable !== undefined 
            ? existingDaySchedule.isAvailable 
            : defaultDaySchedule.isAvailable,
          startTime: existingDaySchedule.startTime || defaultDaySchedule.startTime,
          endTime: existingDaySchedule.endTime || defaultDaySchedule.endTime,
          slotDuration: defaultDaySchedule.slotDuration,
          breakTimes: defaultDaySchedule.breakTimes
        };
      }

      // Update doctor
      doctor.schedule = updatedSchedule;
      
      // Add defaultSlotDuration if not present
      if (!doctor.defaultSlotDuration) {
        doctor.defaultSlotDuration = 30;
      }

      await doctor.save();
      console.log(`✅ Updated ${doctor.fullName} - added slot-based schedule`);
      updatedCount++;
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total Doctors: ${doctors.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

migrateSchedules();
