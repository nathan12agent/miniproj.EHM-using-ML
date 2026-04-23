require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

async function updateDoctorSchedules() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define different schedules for different specializations
    const schedulesBySpecialization = {
      'Cardiology': {
        // Morning shift: 8:00 AM - 10:00 AM (2 hours)
        startTime: '08:00',
        endTime: '10:00',
        slotDuration: 30,
        breakTimes: []
      },
      'Pediatrics': {
        // Mid-morning: 10:00 AM - 11:30 AM (1.5 hours)
        startTime: '10:00',
        endTime: '11:30',
        slotDuration: 15,
        breakTimes: []
      },
      'Orthopedics': {
        // Afternoon: 14:00 - 16:00 (2:00 PM - 4:00 PM, 2 hours)
        startTime: '14:00',
        endTime: '16:00',
        slotDuration: 45,
        breakTimes: []
      },
      'Ophthalmology': {
        // Evening: 17:00 - 19:00 (5:00 PM - 7:00 PM, 2 hours) - Already set
        startTime: '17:00',
        endTime: '19:00',
        slotDuration: 30,
        breakTimes: []
      }
    };

    const doctors = await Doctor.find({});
    console.log(`Found ${doctors.length} doctors to update\n`);

    let updated = 0;
    
    for (const doctor of doctors) {
      const scheduleConfig = schedulesBySpecialization[doctor.specialization];
      
      if (!scheduleConfig) {
        console.log(`⚠️  No schedule config for ${doctor.specialization}, skipping Dr. ${doctor.firstName} ${doctor.lastName}`);
        continue;
      }

      // Update schedule for Monday through Friday
      const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      
      for (const day of daysOfWeek) {
        doctor.schedule[day] = {
          isAvailable: true,
          startTime: scheduleConfig.startTime,
          endTime: scheduleConfig.endTime,
          slotDuration: scheduleConfig.slotDuration,
          breakTimes: scheduleConfig.breakTimes
        };
      }

      // Weekend - not available
      doctor.schedule.saturday = { isAvailable: false };
      doctor.schedule.sunday = { isAvailable: false };

      await doctor.save();
      updated++;

      console.log(`✅ Updated: Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization})`);
      console.log(`   Schedule: ${scheduleConfig.startTime} - ${scheduleConfig.endTime} (Mon-Fri)`);
      console.log(`   Slot Duration: ${scheduleConfig.slotDuration} minutes`);
      console.log('');
    }

    console.log(`\n✅ Successfully updated ${updated} doctors\n`);
    
    console.log('📋 SUMMARY OF SCHEDULES:\n');
    console.log('Cardiology:    08:00 - 10:00 (2 hours, 30-min slots)');
    console.log('Pediatrics:    10:00 - 11:30 (1.5 hours, 15-min slots)');
    console.log('Orthopedics:   14:00 - 16:00 (2 hours, 45-min slots)');
    console.log('Ophthalmology: 17:00 - 19:00 (2 hours, 30-min slots)');
    console.log('\nAll doctors available Monday-Friday, weekends off.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

updateDoctorSchedules();
