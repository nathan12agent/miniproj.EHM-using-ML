const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
require('dotenv').config();

const seedCardiologist = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('Connected to MongoDB');

    // Delete existing cardiologist user if exists
    await User.deleteOne({ email: 'cardiologist@hospital.com' });
    await Doctor.deleteMany({ email: 'cardiologist@hospital.com' });
    console.log('✓ Cleaned up existing cardiologist data');

    // Create fresh cardiologist user
    const newUser = new User({
      name: 'Dr. Sarah Johnson',
      email: 'cardiologist@hospital.com',
      password: 'cardio123',
      role: 'Doctor',
      phone: '555-0201',
      department: 'Cardiology',
      isActive: true
    });
    await newUser.save();
    const userId = newUser._id;
    console.log('✓ Cardiologist user created with fresh password');

    // Create cardiologist profile
    const departmentId = new mongoose.Types.ObjectId();

    const doctor = new Doctor({
        userId,
        firstName: 'Sarah',
        lastName: 'Johnson',
        dateOfBirth: new Date('1985-08-20'),
        gender: 'Female',
        phone: '555-0201',
        email: 'cardiologist@hospital.com',
        address: {
          street: '456 Heart Center Ave',
          city: 'Medical City',
          state: 'CA',
          zipCode: '90211',
          country: 'USA'
        },
        medicalLicenseNumber: 'MD789012',
        specialization: 'Cardiology',
        subSpecialization: 'Interventional Cardiology',
        qualifications: [
          {
            degree: 'MD',
            institution: 'Johns Hopkins Medical School',
            year: 2010,
            country: 'USA'
          },
          {
            degree: 'Fellowship in Cardiology',
            institution: 'Mayo Clinic',
            year: 2013,
            country: 'USA'
          }
        ],
        experience: 12,
        department: departmentId,
        consultationFee: 250,
        bio: 'Board-certified cardiologist specializing in interventional procedures',
        languages: ['English', 'Spanish'],
        status: 'Active'
      });

    await doctor.save();
    const doctorId = doctor._id;
    console.log('✓ Cardiologist profile created');

    // Create appointments for cardiologist with patients
    const Appointment = require('../models/Appointment');
    const patients = await Patient.find().limit(3);
    
    if (patients.length > 0) {
      const today = new Date();
      const appointmentPromises = patients.map((patient, index) => {
        const appointmentDate = new Date(today);
        appointmentDate.setDate(today.getDate() + index);
        
        return new Appointment({
          patient: patient._id,
          doctor: doctorId,
          appointmentDate: appointmentDate,
          appointmentTime: '10:00',
          duration: 30,
          type: 'Consultation',
          visitType: 'Outpatient',
          status: 'Scheduled',
          reason: 'Cardiac checkup'
        }).save();
      });
      
      await Promise.all(appointmentPromises);
      console.log(`✓ Created ${patients.length} appointments for cardiologist`);
    } else {
      console.log('✓ No patients found to create appointments');
    }

    console.log('\n========================================');
    console.log('Cardiologist seeded successfully!');
    console.log('========================================');
    console.log('Login credentials:');
    console.log('Email: cardiologist@hospital.com');
    console.log('Password: cardio123');
    console.log('Specialization: Cardiology');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding cardiologist:', error);
    process.exit(1);
  }
};

seedCardiologist();
