const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
require('dotenv').config();

const seedDoctor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('Connected to MongoDB');

    // Create doctor user
    const doctorUser = await User.findOne({ email: 'doctor@hospital.com' });
    
    let userId;
    if (!doctorUser) {
      const newUser = new User({
        name: 'Dr. John Smith',
        email: 'doctor@hospital.com',
        password: 'doctor123',
        role: 'Doctor',
        phone: '555-0101',
        department: 'General Medicine',
        isActive: true
      });
      await newUser.save();
      userId = newUser._id;
      console.log('Doctor user created');
    } else {
      userId = doctorUser._id;
      console.log('Doctor user already exists');
    }

    // Check if doctor profile exists
    const existingDoctor = await Doctor.findOne({ userId });
    
    if (!existingDoctor) {
      // Create a department first (you may need to adjust this based on your Department model)
      const departmentId = new mongoose.Types.ObjectId();

      const doctor = new Doctor({
        userId,
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: new Date('1980-05-15'),
        gender: 'Male',
        phone: '555-0101',
        email: 'doctor@hospital.com',
        address: {
          street: '123 Medical Center Dr',
          city: 'Healthcare City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        medicalLicenseNumber: 'MD123456',
        specialization: 'General Medicine',
        qualifications: [
          {
            degree: 'MD',
            institution: 'Harvard Medical School',
            year: 2005,
            country: 'USA'
          }
        ],
        experience: 18,
        department: departmentId,
        consultationFee: 150,
        bio: 'Experienced general practitioner with 18 years of practice',
        languages: ['English', 'Spanish'],
        status: 'Active',
        mlAccess: true, // Enable ML access
        mlAccessGrantedDate: new Date(),
        mlStats: {
          totalPredictions: 0,
          averageConfidence: 0,
          accuracyRating: 0
        }
      });

      await doctor.save();
      console.log('Doctor profile created successfully');
      console.log('Login credentials:');
      console.log('Email: doctor@hospital.com');
      console.log('Password: doctor123');
    } else {
      console.log('Doctor profile already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding doctor:', error);
    process.exit(1);
  }
};

seedDoctor();
