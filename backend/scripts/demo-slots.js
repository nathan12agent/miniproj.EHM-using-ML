require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

async function demoSlots() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find any existing doctor or create one
    let doctor = await Doctor.findOne({ specialization: 'Ophthalmology' });
    
    if (!doctor) {
      console.log('📋 Creating demo doctor...');
      doctor = await Doctor.create({
        firstName: 'Sarah',
        lastName: 'Johnson',
        specialization: 'Ophthalmology',
        email: `sarah.johnson.${Date.now()}@hospital.com`,
        phone: '555-0123',
        status: 'Active',
        schedule: {
          monday: {
            isAvailable: true,
            startTime: '17:00',
            endTime: '19:00',
            slotDuration: 30,
            breakTimes: []
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
            slotDuration: 15,
            breakTimes: []
          }
        }
      });
      console.log(`✅ Created: Dr. ${doctor.firstName} ${doctor.lastName}\n`);
    } else {
      console.log(`✅ Using existing doctor: Dr. ${doctor.firstName} ${doctor.lastName}\n`);
    }

    // Demo: Generate slots for next Monday
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7);
    
    console.log('📅 DEMO: Appointment Slot Booking Feature\n');
    console.log('=' .repeat(60));
    console.log(`Doctor: Dr. ${doctor.firstName} ${doctor.lastName}`);
    console.log(`Specialization: ${doctor.specialization}`);
    console.log(`Doctor ID: ${doctor._id}`);
    console.log('=' .repeat(60));
    
    // Monday slots
    console.log('\n🕐 MONDAY SCHEDULE:');
    console.log(`   Working Hours: 5:00 PM - 7:00 PM`);
    console.log(`   Slot Duration: 30 minutes`);
    const mondaySlots = doctor.generateTimeSlots(nextMonday);
    console.log(`   Available Slots: ${mondaySlots.length}`);
    mondaySlots.forEach(slot => {
      console.log(`   ✓ ${slot.startTime} - ${slot.endTime}`);
    });
    
    // Tuesday slots
    const nextTuesday = new Date(nextMonday);
    nextTuesday.setDate(nextTuesday.getDate() + 1);
    console.log('\n🕐 TUESDAY SCHEDULE:');
    console.log(`   Working Hours: 9:00 AM - 5:00 PM`);
    console.log(`   Lunch Break: 12:00 PM - 1:00 PM`);
    console.log(`   Slot Duration: 30 minutes`);
    const tuesdaySlots = doctor.generateTimeSlots(nextTuesday);
    console.log(`   Available Slots: ${tuesdaySlots.length}`);
    console.log(`   First 5 slots:`);
    tuesdaySlots.slice(0, 5).forEach(slot => {
      console.log(`   ✓ ${slot.startTime} - ${slot.endTime}`);
    });
    
    console.log('\n\n🔗 API ENDPOINTS TO TEST:\n');
    console.log(`1. Get Available Slots:`);
    console.log(`   GET http://localhost:5000/api/doctors/${doctor._id}/available-slots?date=${nextMonday.toISOString().split('T')[0]}`);
    console.log(`\n2. Book an Appointment:`);
    console.log(`   POST http://localhost:5000/api/appointments`);
    console.log(`   Body: {`);
    console.log(`     "doctor": "${doctor._id}",`);
    console.log(`     "patient": "<patient_id>",`);
    console.log(`     "appointmentDate": "${nextMonday.toISOString().split('T')[0]}",`);
    console.log(`     "appointmentTime": "17:00",`);
    console.log(`     "reason": "Eye checkup"`);
    console.log(`   }`);
    
    console.log('\n\n✅ FEATURE HIGHLIGHTS:\n');
    console.log('   ✓ Doctors have per-day schedules');
    console.log('   ✓ Configurable slot durations (15, 30, 45, 60 min)');
    console.log('   ✓ Break times supported');
    console.log('   ✓ Automatic slot generation');
    console.log('   ✓ Prevents double-booking');
    console.log('   ✓ Validates time alignment');
    console.log('   ✓ Prevents past date bookings');
    console.log('   ✓ Backend validation enforced');
    
    console.log('\n\n📖 DOCUMENTATION:\n');
    console.log('   • Complete Guide: docs/APPOINTMENT_SLOT_BOOKING_GUIDE.md');
    console.log('   • Quick Start: docs/APPOINTMENT_SLOTS_QUICK_START.md');
    console.log('   • API Docs: http://localhost:5000/api-docs');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

demoSlots();
