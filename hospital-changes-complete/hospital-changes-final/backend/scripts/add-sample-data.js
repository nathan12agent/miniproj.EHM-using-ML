require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

async function addSampleData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Add sample patients
    console.log('📋 Adding sample patients...');
    const patients = await Patient.create([
      {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'Male',
        phone: '555-0101',
        email: 'john.doe@email.com',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        }
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1985-08-22'),
        gender: 'Female',
        phone: '555-0102',
        email: 'jane.smith@email.com',
        address: {
          street: '456 Oak Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10002'
        }
      },
      {
        firstName: 'Michael',
        lastName: 'Johnson',
        dateOfBirth: new Date('1978-12-10'),
        gender: 'Male',
        phone: '555-0103',
        email: 'michael.j@email.com',
        address: {
          street: '789 Pine Rd',
          city: 'New York',
          state: 'NY',
          zipCode: '10003'
        }
      }
    ]);
    console.log(`✅ Created ${patients.length} patients\n`);

    // Add more doctors with schedules
    console.log('👨‍⚕️ Adding sample doctors with schedules...');
    const doctors = await Doctor.create([
      {
        firstName: 'Robert',
        lastName: 'Williams',
        specialization: 'Cardiology',
        email: `robert.williams.${Date.now()}@hospital.com`,
        phone: '555-0201',
        status: 'Active',
        schedule: {
          monday: {
            isAvailable: true,
            startTime: '09:00',
            endTime: '17:00',
            slotDuration: 30,
            breakTimes: [{ startTime: '12:00', endTime: '13:00' }]
          },
          tuesday: {
            isAvailable: true,
            startTime: '09:00',
            endTime: '17:00',
            slotDuration: 30,
            breakTimes: [{ startTime: '12:00', endTime: '13:00' }]
          },
          wednesday: {
            isAvailable: true,
            startTime: '09:00',
            endTime: '17:00',
            slotDuration: 30,
            breakTimes: [{ startTime: '12:00', endTime: '13:00' }]
          },
          thursday: {
            isAvailable: true,
            startTime: '09:00',
            endTime: '17:00',
            slotDuration: 30,
            breakTimes: [{ startTime: '12:00', endTime: '13:00' }]
          },
          friday: {
            isAvailable: true,
            startTime: '09:00',
            endTime: '13:00',
            slotDuration: 30,
            breakTimes: []
          }
        }
      },
      {
        firstName: 'Emily',
        lastName: 'Davis',
        specialization: 'Pediatrics',
        email: `emily.davis.${Date.now()}@hospital.com`,
        phone: '555-0202',
        status: 'Active',
        schedule: {
          monday: {
            isAvailable: true,
            startTime: '08:00',
            endTime: '16:00',
            slotDuration: 15,
            breakTimes: [{ startTime: '12:00', endTime: '12:30' }]
          },
          tuesday: {
            isAvailable: true,
            startTime: '08:00',
            endTime: '16:00',
            slotDuration: 15,
            breakTimes: [{ startTime: '12:00', endTime: '12:30' }]
          },
          wednesday: {
            isAvailable: true,
            startTime: '08:00',
            endTime: '16:00',
            slotDuration: 15,
            breakTimes: [{ startTime: '12:00', endTime: '12:30' }]
          },
          thursday: {
            isAvailable: true,
            startTime: '08:00',
            endTime: '16:00',
            slotDuration: 15,
            breakTimes: [{ startTime: '12:00', endTime: '12:30' }]
          },
          friday: {
            isAvailable: true,
            startTime: '08:00',
            endTime: '16:00',
            slotDuration: 15,
            breakTimes: [{ startTime: '12:00', endTime: '12:30' }]
          }
        }
      },
      {
        firstName: 'David',
        lastName: 'Martinez',
        specialization: 'Orthopedics',
        email: `david.martinez.${Date.now()}@hospital.com`,
        phone: '555-0203',
        status: 'Active',
        schedule: {
          monday: {
            isAvailable: true,
            startTime: '10:00',
            endTime: '18:00',
            slotDuration: 45,
            breakTimes: [{ startTime: '13:00', endTime: '14:00' }]
          },
          tuesday: {
            isAvailable: true,
            startTime: '10:00',
            endTime: '18:00',
            slotDuration: 45,
            breakTimes: [{ startTime: '13:00', endTime: '14:00' }]
          },
          wednesday: {
            isAvailable: true,
            startTime: '10:00',
            endTime: '18:00',
            slotDuration: 45,
            breakTimes: [{ startTime: '13:00', endTime: '14:00' }]
          },
          thursday: {
            isAvailable: false
          },
          friday: {
            isAvailable: true,
            startTime: '10:00',
            endTime: '14:00',
            slotDuration: 45,
            breakTimes: []
          }
        }
      }
    ]);
    console.log(`✅ Created ${doctors.length} doctors\n`);

    console.log('📊 SAMPLE DATA SUMMARY:\n');
    console.log('Patients:');
    patients.forEach(p => {
      console.log(`  • ${p.firstName} ${p.lastName} (${p.patientId})`);
    });
    
    console.log('\nDoctors:');
    doctors.forEach(d => {
      console.log(`  • Dr. ${d.firstName} ${d.lastName} - ${d.specialization}`);
      console.log(`    ID: ${d._id}`);
    });

    console.log('\n✅ Sample data added successfully!');
    console.log('\n🎯 Now you can test the appointment booking feature!');
    console.log('   1. Go to http://localhost:3000');
    console.log('   2. Click "Add Appointment"');
    console.log('   3. Select a doctor and date');
    console.log('   4. See the available time slots!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

addSampleData();
