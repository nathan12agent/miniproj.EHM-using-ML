const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Bed = require('../models/Bed');
const Nurse = require('../models/Nurse');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Dr. Admin',
      email: 'admin@hospital.com',
      password: 'admin123',
      role: 'Administrator',
      phone: '+1234567890',
      department: 'Administration'
    });
    console.log('Created admin user:', adminUser.email);

    // Create sample doctors one by one to avoid duplicate doctorId
    const doctor1 = await Doctor.create({
      doctorId: 'DOC001',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: new Date('1975-05-15'),
      gender: 'Male',
      specialization: 'Cardiology',
      medicalLicenseNumber: 'MED-CARD-001',
      experience: 15,
      phone: '+1234567891',
      email: 'john.smith@hospital.com',
      consultationFee: 150,
      status: 'Active',
      userId: adminUser._id,
      department: adminUser._id, // Using admin ID as placeholder for department
      qualifications: [{
        degree: 'MD',
        institution: 'Harvard Medical School',
        year: 2005,
        country: 'USA'
      }]
    });

    const doctor2 = await Doctor.create({
      doctorId: 'DOC002',
      firstName: 'Sarah',
      lastName: 'Johnson',
      dateOfBirth: new Date('1980-08-22'),
      gender: 'Female',
      specialization: 'Pediatrics',
      medicalLicenseNumber: 'MED-PED-002',
      experience: 10,
      phone: '+1234567892',
      email: 'sarah.johnson@hospital.com',
      consultationFee: 120,
      status: 'Active',
      userId: adminUser._id,
      department: adminUser._id, // Using admin ID as placeholder for department
      qualifications: [{
        degree: 'MD',
        institution: 'Johns Hopkins University',
        year: 2010,
        country: 'USA'
      }]
    });

    const doctor3 = await Doctor.create({
      doctorId: 'DOC003',
      firstName: 'Michael',
      lastName: 'Brown',
      dateOfBirth: new Date('1978-03-10'),
      gender: 'Male',
      specialization: 'Orthopedics',
      medicalLicenseNumber: 'MED-ORTH-003',
      experience: 12,
      phone: '+1234567893',
      email: 'michael.brown@hospital.com',
      consultationFee: 140,
      status: 'Active',
      userId: adminUser._id,
      department: adminUser._id, // Using admin ID as placeholder for department
      qualifications: [{
        degree: 'MD, MS Ortho',
        institution: 'Stanford University',
        year: 2008,
        country: 'USA'
      }]
    });

    console.log(`Created 3 doctors`);

    // Create sample patients
    const patients = await Patient.create([
      {
        firstName: 'Alice',
        lastName: 'Williams',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'Female',
        phone: '+1234567894',
        email: 'alice.williams@email.com',
        bloodGroup: 'A+',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        emergencyContact: {
          name: 'Bob Williams',
          relationship: 'Spouse',
          phone: '+1234567895'
        },
        status: 'Active'
      },
      {
        firstName: 'Robert',
        lastName: 'Davis',
        dateOfBirth: new Date('1990-08-22'),
        gender: 'Male',
        phone: '+1234567896',
        email: 'robert.davis@email.com',
        bloodGroup: 'O+',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA'
        },
        emergencyContact: {
          name: 'Mary Davis',
          relationship: 'Mother',
          phone: '+1234567897'
        },
        status: 'Active'
      }
    ]);
    console.log(`Created ${patients.length} patients`);

    // Clear bed and nurse data
    await Bed.deleteMany({});
    await Nurse.deleteMany({});
    console.log('Cleared bed and nurse data');

    // Create sample beds - 20 beds per ward
    const beds = [];
    
    // ICU Beds - 20 beds
    for (let i = 1; i <= 20; i++) {
      beds.push({
        bedNumber: `ICU-${String(i).padStart(3, '0')}`,
        ward: 'ICU',
        status: i <= 8 ? 'Occupied' : (i === 9 || i === 10 ? 'Maintenance' : 'Available'),
        createdBy: adminUser._id
      });
    }
    
    // General Ward Beds - 20 beds
    for (let i = 1; i <= 20; i++) {
      beds.push({
        bedNumber: `GEN-${String(i).padStart(3, '0')}`,
        ward: 'General',
        status: i <= 10 ? 'Occupied' : 'Available',
        createdBy: adminUser._id
      });
    }
    
    // Emergency Beds - 20 beds
    for (let i = 1; i <= 20; i++) {
      beds.push({
        bedNumber: `ER-${String(i).padStart(3, '0')}`,
        ward: 'Emergency',
        status: i <= 6 ? 'Occupied' : 'Available',
        createdBy: adminUser._id
      });
    }

    const createdBeds = await Bed.insertMany(beds);
    console.log(`Created ${createdBeds.length} beds`);

    // Create sample nurses with varying working hours and patient loads
    const nurses = [
      // ICU Nurses
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@hospital.com',
        phone: '+1234567801',
        ward: 'ICU',
        shift: 'Morning',
        status: 'On Duty',
        specialization: 'Critical Care',
        experience: 8,
        workingHours: 8,
        maxPatientLoad: 4,
        createdBy: adminUser._id
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@hospital.com',
        phone: '+1234567802',
        ward: 'ICU',
        shift: 'Evening',
        status: 'On Duty',
        specialization: 'Critical Care',
        experience: 6,
        workingHours: 12,
        maxPatientLoad: 5,
        createdBy: adminUser._id
      },
      {
        firstName: 'Jennifer',
        lastName: 'Martinez',
        email: 'jennifer.martinez@hospital.com',
        phone: '+1234567807',
        ward: 'ICU',
        shift: 'Night',
        status: 'On Duty',
        specialization: 'Critical Care',
        experience: 10,
        workingHours: 10,
        maxPatientLoad: 4,
        createdBy: adminUser._id
      },
      // General Ward Nurses
      {
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@hospital.com',
        phone: '+1234567803',
        ward: 'General',
        shift: 'Morning',
        status: 'On Duty',
        specialization: 'General Nursing',
        experience: 5,
        workingHours: 8,
        maxPatientLoad: 6,
        createdBy: adminUser._id
      },
      {
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@hospital.com',
        phone: '+1234567804',
        ward: 'General',
        shift: 'Morning',
        status: 'On Break',
        specialization: 'General Nursing',
        experience: 4,
        workingHours: 8,
        maxPatientLoad: 5,
        createdBy: adminUser._id
      },
      {
        firstName: 'Patricia',
        lastName: 'White',
        email: 'patricia.white@hospital.com',
        phone: '+1234567810',
        ward: 'Emergency',
        shift: 'Evening',
        status: 'On Duty',
        specialization: 'General Nursing',
        experience: 7,
        workingHours: 12,
        maxPatientLoad: 7,
        createdBy: adminUser._id
      },
      {
        firstName: 'David',
        lastName: 'Lee',
        email: 'david.lee@hospital.com',
        phone: '+1234567809',
        ward: 'General',
        shift: 'Night',
        status: 'On Duty',
        specialization: 'General Nursing',
        experience: 6,
        workingHours: 10,
        maxPatientLoad: 6,
        createdBy: adminUser._id
      },
      // Emergency Nurses
      {
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.anderson@hospital.com',
        phone: '+1234567805',
        ward: 'Emergency',
        shift: 'Morning',
        status: 'On Duty',
        specialization: 'Emergency Care',
        experience: 10,
        workingHours: 12,
        maxPatientLoad: 5,
        createdBy: adminUser._id
      },
      {
        firstName: 'Robert',
        lastName: 'Taylor',
        email: 'robert.taylor@hospital.com',
        phone: '+1234567806',
        ward: 'Emergency',
        shift: 'Night',
        status: 'On Duty',
        specialization: 'Emergency Care',
        experience: 7,
        workingHours: 10,
        maxPatientLoad: 5,
        createdBy: adminUser._id
      },
      {
        firstName: 'Patricia',
        lastName: 'White',
        email: 'patricia.white@hospital.com',
        phone: '+1234567810',
        ward: 'Emergency',
        shift: 'Evening',
        status: 'On Duty',
        specialization: 'Emergency Care',
        experience: 9,
        workingHours: 8,
        maxPatientLoad: 6,
        createdBy: adminUser._id
      },
      // Additional ICU Nurses
      {
        firstName: 'Thomas',
        lastName: 'Brown',
        email: 'thomas.brown@hospital.com',
        phone: '+1234567811',
        ward: 'ICU',
        shift: 'Morning',
        status: 'On Duty',
        specialization: 'Critical Care',
        experience: 12,
        workingHours: 12,
        maxPatientLoad: 5,
        createdBy: adminUser._id
      },
      {
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@hospital.com',
        phone: '+1234567812',
        ward: 'ICU',
        shift: 'Evening',
        status: 'On Duty',
        specialization: 'Critical Care',
        experience: 9,
        workingHours: 8,
        maxPatientLoad: 4,
        createdBy: adminUser._id
      },
      // Additional General Ward Nurses
      {
        firstName: 'Christopher',
        lastName: 'Miller',
        email: 'christopher.miller@hospital.com',
        phone: '+1234567813',
        ward: 'General',
        shift: 'Night',
        status: 'On Duty',
        specialization: 'General Nursing',
        experience: 5,
        workingHours: 10,
        maxPatientLoad: 6,
        createdBy: adminUser._id
      },
      {
        firstName: 'Jessica',
        lastName: 'Davis',
        email: 'jessica.davis@hospital.com',
        phone: '+1234567814',
        ward: 'General',
        shift: 'Evening',
        status: 'On Duty',
        specialization: 'General Nursing',
        experience: 8,
        workingHours: 8,
        maxPatientLoad: 7,
        createdBy: adminUser._id
      },
      {
        firstName: 'Daniel',
        lastName: 'Wilson',
        email: 'daniel.wilson@hospital.com',
        phone: '+1234567815',
        ward: 'General',
        shift: 'Morning',
        status: 'On Duty',
        specialization: 'General Nursing',
        experience: 6,
        workingHours: 12,
        maxPatientLoad: 8,
        createdBy: adminUser._id
      },
      // Additional Emergency Nurses
      {
        firstName: 'Michelle',
        lastName: 'Moore',
        email: 'michelle.moore@hospital.com',
        phone: '+1234567816',
        ward: 'Emergency',
        shift: 'Morning',
        status: 'On Duty',
        specialization: 'Emergency Care',
        experience: 11,
        workingHours: 12,
        maxPatientLoad: 6,
        createdBy: adminUser._id
      },
      {
        firstName: 'Kevin',
        lastName: 'Taylor',
        email: 'kevin.taylor@hospital.com',
        phone: '+1234567817',
        ward: 'Emergency',
        shift: 'Night',
        status: 'On Duty',
        specialization: 'Emergency Care',
        experience: 8,
        workingHours: 10,
        maxPatientLoad: 5,
        createdBy: adminUser._id
      },
      {
        firstName: 'Laura',
        lastName: 'Anderson',
        email: 'laura.anderson@hospital.com',
        phone: '+1234567818',
        ward: 'Emergency',
        shift: 'Evening',
        status: 'On Break',
        specialization: 'Emergency Care',
        experience: 7,
        workingHours: 8,
        maxPatientLoad: 5,
        createdBy: adminUser._id
      }
    ];

    const createdNurses = await Nurse.insertMany(nurses);
    console.log(`Created ${createdNurses.length} nurses`);

    // Assign some patients to beds
    const patients = await Patient.find().limit(9);
    if (patients.length > 0) {
      // Assign first 3 patients to ICU beds
      for (let i = 0; i < Math.min(3, patients.length); i++) {
        const bed = createdBeds.find(b => b.bedNumber === `ICU-10${i + 1}`);
        if (bed) {
          bed.patient = patients[i]._id;
          bed.status = 'Occupied';
          bed.assignedDate = new Date();
          await bed.save();
        }
      }

      // Assign next 4 patients to General beds
      for (let i = 3; i < Math.min(7, patients.length); i++) {
        const bed = createdBeds.find(b => b.bedNumber === `GEN-20${i - 2}`);
        if (bed) {
          bed.patient = patients[i]._id;
          bed.status = 'Occupied';
          bed.assignedDate = new Date();
          await bed.save();
        }
      }

      // Assign remaining patients to Emergency beds
      for (let i = 7; i < Math.min(9, patients.length); i++) {
        const bed = createdBeds.find(b => b.bedNumber === `ER-30${i - 6}`);
        if (bed) {
          bed.patient = patients[i]._id;
          bed.status = 'Occupied';
          bed.assignedDate = new Date();
          await bed.save();
        }
      }

      console.log('Assigned patients to beds');
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: admin@hospital.com');
    console.log('Password: admin123');
    console.log('\nDatabase collections created:');
    console.log('- Users');
    console.log('- Doctors');
    console.log('- Patients');
    console.log('- Beds (60 beds: 20 ICU, 20 General, 20 Emergency)');
    console.log('- Nurses (18 nurses: 5 ICU, 7 General, 6 Emergency)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
