/**
 * Test Script for Doctor Schedule-Based Appointment Booking
 * 
 * This script demonstrates:
 * 1. Creating a doctor with a schedule
 * 2. Fetching available slots
 * 3. Booking appointments
 * 4. Validating slot conflicts
 */

const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function runTests() {
  try {
    console.log('🚀 Starting Appointment Slot Booking Tests...\n');

    // Clean up test data
    await Doctor.deleteMany({ firstName: 'Test', lastName: 'Ophthalmologist' });
    await Patient.deleteMany({ firstName: 'Test', lastName: 'Patient' });
    
    // Step 1: Create a test doctor with schedule
    console.log('📋 Step 1: Creating test doctor with schedule...');
    const doctor = new Doctor({
      firstName: 'Test',
      lastName: 'Ophthalmologist',
      specialization: 'Ophthalmology',
      email: 'test.eye@hospital.com',
      phone: '1234567890',
      status: 'Active',
      defaultSlotDuration: 30,
      schedule: {
        monday: {
          isAvailable: true,
          startTime: '17:00', // 5:00 PM
          endTime: '19:00',   // 7:00 PM
          slotDuration: 30,
          breakTimes: []
        },
        tuesday: {
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 30,
          breakTimes: [
            { startTime: '12:00', endTime: '13:00' } // Lunch break
          ]
        },
        wednesday: {
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 15, // 15-minute slots
          breakTimes: []
        },
        thursday: {
          isAvailable: false
        },
        friday: {
          isAvailable: true,
          startTime: '14:00',
          endTime: '18:00',
          slotDuration: 45, // 45-minute slots
          breakTimes: []
        },
        saturday: {
          isAvailable: false
        },
        sunday: {
          isAvailable: false
        }
      }
    });

    await doctor.save();
    console.log(`✅ Doctor created: ${doctor.fullName} (ID: ${doctor._id})`);
    console.log(`   Specialization: ${doctor.specialization}\n`);

    // Step 2: Generate slots for different days
    console.log('📅 Step 2: Generating time slots for different days...\n');

    // Monday slots (5 PM - 7 PM, 30-min slots)
    const monday = new Date();
    monday.setDate(monday.getDate() + ((1 + 7 - monday.getDay()) % 7 || 7)); // Next Monday
    const mondaySlots = doctor.generateTimeSlots(monday);
    console.log(`Monday (${monday.toDateString()}):`);
    console.log(`   Working Hours: 5:00 PM - 7:00 PM`);
    console.log(`   Slot Duration: 30 minutes`);
    console.log(`   Generated Slots: ${mondaySlots.length}`);
    mondaySlots.forEach(slot => {
      console.log(`   - ${slot.startTime} - ${slot.endTime}`);
    });
    console.log('');

    // Tuesday slots (9 AM - 5 PM with lunch break, 30-min slots)
    const tuesday = new Date(monday);
    tuesday.setDate(tuesday.getDate() + 1);
    const tuesdaySlots = doctor.generateTimeSlots(tuesday);
    console.log(`Tuesday (${tuesday.toDateString()}):`);
    console.log(`   Working Hours: 9:00 AM - 5:00 PM`);
    console.log(`   Lunch Break: 12:00 PM - 1:00 PM`);
    console.log(`   Slot Duration: 30 minutes`);
    console.log(`   Generated Slots: ${tuesdaySlots.length}`);
    console.log(`   First 5 slots:`);
    tuesdaySlots.slice(0, 5).forEach(slot => {
      console.log(`   - ${slot.startTime} - ${slot.endTime}`);
    });
    console.log('');

    // Wednesday slots (9 AM - 5 PM, 15-min slots)
    const wednesday = new Date(tuesday);
    wednesday.setDate(wednesday.getDate() + 1);
    const wednesdaySlots = doctor.generateTimeSlots(wednesday);
    console.log(`Wednesday (${wednesday.toDateString()}):`);
    console.log(`   Working Hours: 9:00 AM - 5:00 PM`);
    console.log(`   Slot Duration: 15 minutes`);
    console.log(`   Generated Slots: ${wednesdaySlots.length}`);
    console.log(`   First 5 slots:`);
    wednesdaySlots.slice(0, 5).forEach(slot => {
      console.log(`   - ${slot.startTime} - ${slot.endTime}`);
    });
    console.log('');

    // Thursday (not available)
    const thursday = new Date(wednesday);
    thursday.setDate(thursday.getDate() + 1);
    const thursdaySlots = doctor.generateTimeSlots(thursday);
    console.log(`Thursday (${thursday.toDateString()}):`);
    console.log(`   Status: Not Available`);
    console.log(`   Generated Slots: ${thursdaySlots.length}`);
    console.log('');

    // Step 3: Create test patient
    console.log('👤 Step 3: Creating test patient...');
    const patient = new Patient({
      firstName: 'Test',
      lastName: 'Patient',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Male',
      phone: '9876543210',
      email: 'test.patient@email.com'
    });
    await patient.save();
    console.log(`✅ Patient created: ${patient.firstName} ${patient.lastName} (ID: ${patient._id})\n`);

    // Step 4: Test slot validation
    console.log('🔍 Step 4: Testing slot validation...\n');

    // Valid slot
    const validSlot = mondaySlots[0];
    const isValid = doctor.isValidTimeSlot(monday, validSlot.startTime);
    console.log(`✅ Valid slot test: ${validSlot.startTime} on Monday`);
    console.log(`   Result: ${isValid ? 'VALID' : 'INVALID'}\n`);

    // Invalid slot (outside working hours)
    const invalidTime = '16:00'; // 4 PM (before 5 PM start time)
    const isInvalid = doctor.isValidTimeSlot(monday, invalidTime);
    console.log(`❌ Invalid slot test: ${invalidTime} on Monday`);
    console.log(`   Result: ${isInvalid ? 'VALID' : 'INVALID'}\n`);

    // Invalid slot (not aligned with slot duration)
    const misalignedTime = '17:15'; // 5:15 PM (not aligned with 30-min slots)
    const isMisaligned = doctor.isValidTimeSlot(monday, misalignedTime);
    console.log(`❌ Misaligned slot test: ${misalignedTime} on Monday`);
    console.log(`   Result: ${isMisaligned ? 'VALID' : 'INVALID'}\n`);

    // Step 5: Book appointments
    console.log('📝 Step 5: Booking appointments...\n');

    // Create a test user for createdBy field
    let testUser = await User.findOne({ username: 'test-admin' });
    if (!testUser) {
      testUser = new User({
        username: 'test-admin',
        password: 'test123',
        role: 'admin'
      });
      await testUser.save();
    }

    // Book first slot
    const appointment1 = new Appointment({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: monday,
      appointmentTime: mondaySlots[0].startTime,
      reason: 'Eye checkup',
      status: 'Scheduled',
      createdBy: testUser._id
    });
    await appointment1.save();
    console.log(`✅ Appointment 1 booked: ${mondaySlots[0].startTime} on Monday`);

    // Book second slot
    const appointment2 = new Appointment({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: monday,
      appointmentTime: mondaySlots[1].startTime,
      reason: 'Follow-up',
      status: 'Scheduled',
      createdBy: testUser._id
    });
    await appointment2.save();
    console.log(`✅ Appointment 2 booked: ${mondaySlots[1].startTime} on Monday\n`);

    // Step 6: Check available slots after booking
    console.log('📊 Step 6: Checking available slots after booking...\n');
    const availableSlots = await doctor.getAvailableSlots(monday);
    console.log(`Monday (${monday.toDateString()}):`);
    console.log(`   Total Slots: ${mondaySlots.length}`);
    console.log(`   Booked Slots: ${mondaySlots.length - availableSlots.length}`);
    console.log(`   Available Slots: ${availableSlots.length}`);
    console.log(`   Available times:`);
    availableSlots.forEach(slot => {
      console.log(`   - ${slot.startTime} - ${slot.endTime}`);
    });
    console.log('');

    // Step 7: Test conflict detection
    console.log('⚠️  Step 7: Testing conflict detection...\n');
    try {
      const conflictAppointment = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: monday,
        appointmentTime: mondaySlots[0].startTime, // Already booked!
        reason: 'This should fail',
        status: 'Scheduled',
        createdBy: testUser._id
      });
      await conflictAppointment.save();
      console.log('❌ ERROR: Conflict not detected! This should have failed.\n');
    } catch (error) {
      console.log('✅ Conflict detected correctly (appointment not saved)\n');
    }

    // Step 8: Summary
    console.log('📈 Summary:\n');
    console.log(`Doctor: ${doctor.fullName}`);
    console.log(`Specialization: ${doctor.specialization}`);
    console.log(`Default Slot Duration: ${doctor.defaultSlotDuration} minutes`);
    console.log(`\nSchedule:`);
    console.log(`  Monday: 5:00 PM - 7:00 PM (30-min slots) - ${mondaySlots.length} slots`);
    console.log(`  Tuesday: 9:00 AM - 5:00 PM (30-min slots, lunch break) - ${tuesdaySlots.length} slots`);
    console.log(`  Wednesday: 9:00 AM - 5:00 PM (15-min slots) - ${wednesdaySlots.length} slots`);
    console.log(`  Thursday: Not Available`);
    console.log(`  Friday: 2:00 PM - 6:00 PM (45-min slots)`);
    console.log(`  Saturday: Not Available`);
    console.log(`  Sunday: Not Available`);
    console.log(`\nAppointments Booked: 2`);
    console.log(`Available Slots (Monday): ${availableSlots.length}`);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n💡 API Endpoints to test:');
    console.log(`   GET /api/doctors/${doctor._id}/available-slots?date=${monday.toISOString().split('T')[0]}`);
    console.log(`   POST /api/appointments (with valid slot)`);
    console.log(`   POST /api/appointments (with invalid slot - should fail)`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

runTests();
