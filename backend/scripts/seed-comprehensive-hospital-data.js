const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Nurse = require('../models/Nurse');
const Staff = require('../models/Staff');
const Bed = require('../models/Bed');
const Appointment = require('../models/Appointment');

// Comprehensive hospital data with auto-assignment logic
const seedData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Nurse.deleteMany({});
    await Staff.deleteMany({});
    await Bed.deleteMany({});
    await Appointment.deleteMany({});
    console.log('✅ Existing data cleared');

    // 1. Create Admin User
    console.log('\n👤 Creating Admin User...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@hospital.com',
      password: 'admin123', // Will be hashed by pre-save hook
      role: 'Administrator',
      phone: '+1234567890',
      department: 'Administration'
    });
    console.log('✅ Admin created: admin@hospital.com / admin123');

    // 2. Create Doctors (100 doctors across specializations for better auto-assignment)
    console.log('\n👨‍⚕️ Creating Doctors...');
    const doctorSpecializations = [
      // Cardiology - Heart specialists
      { name: 'Cardiologist', count: 12, department: 'Cardiology' },
      { name: 'Cardiology', count: 8, department: 'Cardiology' },
      
      // Neurology - Brain and nervous system
      { name: 'Neurologist', count: 10, department: 'Neurology' },
      { name: 'Neurology', count: 6, department: 'Neurology' },
      
      // Gastroenterology - Digestive system
      { name: 'Gastroenterologist', count: 8, department: 'Gastroenterology' },
      
      // Endocrinology - Hormones and metabolism
      { name: 'Endocrinologist', count: 8, department: 'Endocrinology' },
      
      // Dermatology - Skin conditions
      { name: 'Dermatologist', count: 6, department: 'Dermatology' },
      
      // Pulmonology - Respiratory system
      { name: 'Pulmonologist', count: 8, department: 'Pulmonology' },
      
      // Nephrology - Kidney specialists
      { name: 'Nephrologist', count: 6, department: 'Nephrology' },
      
      // Rheumatology - Joint and autoimmune
      { name: 'Rheumatologist', count: 5, department: 'Rheumatology' },
      
      // Orthopedics - Bones and joints
      { name: 'Orthopedic Surgeon', count: 6, department: 'Orthopedics' },
      { name: 'Orthopedics', count: 4, department: 'Orthopedics' },
      
      // Infectious Disease
      { name: 'Infectious Disease Specialist', count: 6, department: 'Infectious Disease' },
      
      // Allergist
      { name: 'Allergist', count: 4, department: 'Allergy' },
      
      // General Surgery
      { name: 'General Surgeon', count: 5, department: 'Surgery' },
      
      // General Practice
      { name: 'General Practitioner', count: 10, department: 'General' },
      { name: 'General Medicine', count: 8, department: 'General' },
      
      // Emergency and ICU
      { name: 'Emergency Medicine', count: 8, department: 'Emergency' },
      { name: 'ICU Specialist', count: 6, department: 'ICU' }
    ];

    const doctors = [];
    const doctorUsers = [];
    let doctorIdCounter = 1;

    for (const spec of doctorSpecializations) {
      for (let i = 0; i < spec.count; i++) {
        const firstName = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'James', 'Maria'][Math.floor(Math.random() * 8)];
        const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][Math.floor(Math.random() * 8)];
        
        const email = `dr.${firstName.toLowerCase()}.${lastName.toLowerCase()}${doctorIdCounter}@hospital.com`;
        
        // Create user account
        const doctorUser = await User.create({
          name: `Dr. ${firstName} ${lastName}`,
          email,
          password: 'doctor123', // Will be hashed by pre-save hook
          role: 'Doctor',
          phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          department: spec.department
        });
        doctorUsers.push(doctorUser);

        // Create doctor profile
        const doctor = await Doctor.create({
          userId: doctorUser._id,
          name: `Dr. ${firstName} ${lastName}`,
          email,
          phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          specialization: spec.name,
          department: spec.department,
          qualification: ['MBBS', 'MD', spec.name === 'General Medicine' ? 'FRCP' : 'DNB'].join(', '),
          experience: Math.floor(Math.random() * 20) + 5,
          consultationFee: Math.floor(Math.random() * 100) + 50,
          availability: {
            monday: { available: true, slots: ['09:00-12:00', '14:00-17:00'] },
            tuesday: { available: true, slots: ['09:00-12:00', '14:00-17:00'] },
            wednesday: { available: true, slots: ['09:00-12:00', '14:00-17:00'] },
            thursday: { available: true, slots: ['09:00-12:00', '14:00-17:00'] },
            friday: { available: true, slots: ['09:00-12:00', '14:00-17:00'] },
            saturday: { available: i % 2 === 0, slots: ['09:00-13:00'] },
            sunday: { available: false, slots: [] }
          },
          rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
          patientsAttended: Math.floor(Math.random() * 500) + 100
        });
        
        doctors.push(doctor);
        doctorIdCounter++;
      }
    }
    console.log(`✅ Created ${doctors.length} doctors`);

    // 3. Create Nurses (150 nurses across departments for better coverage)
    console.log('\n👩‍⚕️ Creating Nurses...');
    const nurseDepartments = [
      { name: 'ICU', count: 25 },
      { name: 'General', count: 40 },
      { name: 'Emergency', count: 20 },
      { name: 'Cardiology', count: 15 },
      { name: 'Neurology', count: 12 },
      { name: 'Orthopedics', count: 10 },
      { name: 'Pediatrics', count: 10 },
      { name: 'Gastroenterology', count: 8 },
      { name: 'Endocrinology', count: 5 },
      { name: 'Dermatology', count: 5 }
    ];
    const nurses = [];
    
    for (const dept of nurseDepartments) {
      for (let i = 1; i <= dept.count; i++) {
        const firstName = ['Anna', 'Emma', 'Olivia', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Sofia', 'Avery', 'Ella', 'Scarlett', 'Grace', 'Chloe', 'Victoria'][Math.floor(Math.random() * 20)];
        const lastName = ['Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen'][Math.floor(Math.random() * 20)];
        
        const nurse = await Nurse.create({
          firstName,
          lastName,
          email: `nurse.${firstName.toLowerCase()}.${lastName.toLowerCase()}${Date.now()}${i}@hospital.com`,
          phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          ward: dept.name,
          shift: ['Morning', 'Evening', 'Night'][Math.floor(Math.random() * 3)],
          experience: Math.floor(Math.random() * 15) + 2,
          qualification: 'BSN, RN',
          specialization: dept.name,
          status: Math.random() > 0.2 ? 'On Duty' : 'Off Duty',
          workingHours: [8, 10, 12][Math.floor(Math.random() * 3)],
          maxPatientLoad: Math.floor(Math.random() * 3) + 4 // 4-6 patients
        });
        
        nurses.push(nurse);
      }
    }
    console.log(`✅ Created ${nurses.length} nurses`);

    // 4. Create Staff (Admin, Technicians, Receptionists)
    console.log('\n👥 Creating Staff Members...');
    const staffRoles = [
      { role: 'Receptionist', department: 'Admin', count: 10 },
      { role: 'Technician', department: 'Lab', count: 15 },
      { role: 'Technician', department: 'Radiology', count: 8 },
      { role: 'Admin', department: 'Admin', count: 7 }
    ];

    const staffMembers = [];
    let staffIdCounter = 1;

    for (const staffType of staffRoles) {
      for (let i = 0; i < staffType.count; i++) {
        const firstName = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Drew'][Math.floor(Math.random() * 8)];
        const lastName = ['Martin', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright'][Math.floor(Math.random() * 8)];
        
        const staff = await Staff.create({
          staffId: `STF${String(staffIdCounter).padStart(3, '0')}`,
          name: `${firstName} ${lastName}`,
          role: staffType.role,
          department: staffType.department,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${staffIdCounter}@hospital.com`,
          phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          experienceYears: Math.floor(Math.random() * 10) + 1,
          specialization: [staffType.department],
          shiftPreference: ['Day', 'Night', 'Rotating'][Math.floor(Math.random() * 3)],
          distanceFromHospital: Math.floor(Math.random() * 40) + 5,
          currentStatus: Math.random() > 0.2 ? 'On-Duty' : 'Off-Duty',
          performanceRating: Math.floor(Math.random() * 2) + 3, // 3-5
          shiftHistory: [],
          absenceHistory: []
        });
        
        staffMembers.push(staff);
        staffIdCounter++;
      }
    }
    console.log(`✅ Created ${staffMembers.length} staff members`);

    // 5. Create Beds (200 beds across departments for better availability)
    console.log('\n🛏️  Creating Beds...');
    const bedDepartments = [
      { name: 'ICU', count: 40, type: 'ICU' },
      { name: 'Emergency', count: 30, type: 'Emergency' },
      { name: 'General', count: 80, type: 'General' },
      { name: 'Cardiology', count: 20, type: 'Special' },
      { name: 'Neurology', count: 15, type: 'Special' },
      { name: 'Orthopedics', count: 15, type: 'Special' }
    ];

    const beds = [];
    let bedNumber = 1;

    for (const dept of bedDepartments) {
      for (let i = 0; i < dept.count; i++) {
        const bed = await Bed.create({
          bedNumber: `${dept.name.substring(0, 3).toUpperCase()}-${String(bedNumber).padStart(3, '0')}`,
          department: dept.name,
          type: dept.type,
          status: Math.random() > 0.4 ? 'Available' : 'Occupied',
          floor: Math.floor(bedNumber / 20) + 1,
          room: `${Math.floor(bedNumber / 4) + 1}`,
          assignedPatient: null,
          assignedNurse: null,
          lastCleaned: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          features: ['Oxygen', 'Monitor', dept.type === 'ICU' ? 'Ventilator' : 'Basic Care']
        });
        
        beds.push(bed);
        bedNumber++;
      }
    }
    console.log(`✅ Created ${beds.length} beds`);

    // 6. Create Patients with AUTO-ASSIGNMENT
    console.log('\n🏥 Creating Patients with Auto-Assignment...');
    const patientConditions = [
      { condition: 'Cardiac Arrest', department: 'Cardiology', severity: 'Critical', needsICU: true },
      { condition: 'Stroke', department: 'Neurology', severity: 'Critical', needsICU: true },
      { condition: 'Pneumonia', department: 'General Ward', severity: 'Moderate', needsICU: false },
      { condition: 'Diabetes', department: 'General Ward', severity: 'Stable', needsICU: false },
      { condition: 'Fracture', department: 'Orthopedics', severity: 'Moderate', needsICU: false },
      { condition: 'Fever', department: 'Pediatrics', severity: 'Mild', needsICU: false },
      { condition: 'Accident', department: 'ER', severity: 'Critical', needsICU: false },
      { condition: 'Chest Pain', department: 'Cardiology', severity: 'Moderate', needsICU: false }
    ];

    const patients = [];
    
    for (let i = 1; i <= 60; i++) {
      const firstName = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Mary'][Math.floor(Math.random() * 10)];
      const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][Math.floor(Math.random() * 10)];
      
      // Random condition
      const condition = patientConditions[Math.floor(Math.random() * patientConditions.length)];
      
      // AUTO-ASSIGN DOCTOR based on department/specialization
      const availableDoctors = doctors.filter(d => 
        d.department === condition.department || 
        d.specialization.includes(condition.department)
      );
      const assignedDoctor = availableDoctors[Math.floor(Math.random() * availableDoctors.length)];
      
      // AUTO-ASSIGN BED based on department and availability
      let assignedBed = null;
      if (condition.needsICU) {
        // Assign ICU bed
        const availableICUBeds = beds.filter(b => b.department === 'ICU' && b.status === 'Available');
        if (availableICUBeds.length > 0) {
          assignedBed = availableICUBeds[0];
        }
      } else {
        // Assign regular bed in appropriate department
        const availableBeds = beds.filter(b => 
          (b.department === condition.department || b.department === 'General Ward') && 
          b.status === 'Available'
        );
        if (availableBeds.length > 0) {
          assignedBed = availableBeds[0];
        }
      }
      
      // AUTO-ASSIGN NURSE from same department
      let assignedNurse = null;
      if (assignedBed) {
        const availableNurses = nurses.filter(n => 
          n.department === assignedBed.department && 
          n.currentStatus === 'On-Duty' &&
          n.assignedBeds.length < 5 // Max 5 patients per nurse
        );
        if (availableNurses.length > 0) {
          assignedNurse = availableNurses[0];
        }
      }
      
      // Create patient
      const patient = await Patient.create({
        name: `${firstName} ${lastName}`,
        age: Math.floor(Math.random() * 60) + 20,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
        phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        address: `${Math.floor(Math.random() * 9999) + 1} Main St, City, State ${Math.floor(Math.random() * 90000) + 10000}`,
        bloodGroup: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)],
        emergencyContact: {
          name: `${firstName} ${lastName} Jr.`,
          relationship: 'Spouse',
          phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`
        },
        medicalHistory: [condition.condition],
        currentMedications: ['Medication A', 'Medication B'],
        allergies: Math.random() > 0.7 ? ['Penicillin'] : [],
        admissionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        status: condition.severity === 'Critical' ? 'Critical' : (condition.severity === 'Moderate' ? 'Stable' : 'Recovering'),
        assignedDoctor: assignedDoctor ? assignedDoctor._id : null,
        assignedBed: assignedBed ? assignedBed._id : null,
        assignedNurse: assignedNurse ? assignedNurse._id : null,
        department: condition.department,
        roomNumber: assignedBed ? assignedBed.room : 'Pending',
        diagnosis: condition.condition,
        treatmentPlan: `Treatment for ${condition.condition}`,
        vitals: {
          temperature: (Math.random() * 2 + 97).toFixed(1),
          bloodPressure: `${Math.floor(Math.random() * 40 + 110)}/${Math.floor(Math.random() * 30 + 70)}`,
          heartRate: Math.floor(Math.random() * 40 + 60),
          respiratoryRate: Math.floor(Math.random() * 10 + 12),
          oxygenSaturation: Math.floor(Math.random() * 5 + 95)
        }
      });
      
      patients.push(patient);
      
      // Update bed status and assignment
      if (assignedBed) {
        assignedBed.status = 'Occupied';
        assignedBed.assignedPatient = patient._id;
        assignedBed.assignedNurse = assignedNurse ? assignedNurse._id : null;
        await assignedBed.save();
      }
      
      // Update nurse assignment
      if (assignedNurse) {
        assignedNurse.assignedBeds.push(assignedBed._id);
        await assignedNurse.save();
      }
    }
    console.log(`✅ Created ${patients.length} patients with auto-assignments`);

    // 7. Create Appointments with AUTO-ASSIGNMENT
    console.log('\n📅 Creating Appointments...');
    const appointments = [];
    
    for (let i = 0; i < 40; i++) {
      // Random patient and doctor
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      
      // Random date in next 14 days
      const appointmentDate = new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000);
      const hour = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
      appointmentDate.setHours(hour, 0, 0, 0);
      
      const appointment = await Appointment.create({
        patientId: patient._id,
        patientName: patient.name,
        doctorId: doctor._id,
        doctorName: doctor.name,
        department: doctor.department,
        appointmentDate,
        appointmentTime: `${hour}:00`,
        status: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'][Math.floor(Math.random() * 4)],
        reason: `Follow-up for ${patient.diagnosis || 'general checkup'}`,
        notes: 'Regular checkup appointment',
        type: ['Consultation', 'Follow-up', 'Emergency'][Math.floor(Math.random() * 3)]
      });
      
      appointments.push(appointment);
    }
    console.log(`✅ Created ${appointments.length} appointments`);

    // 8. Generate Summary Report
    console.log('\n📊 HOSPITAL DATA SUMMARY');
    console.log('═'.repeat(60));
    console.log(`👤 Admin Users: 1`);
    console.log(`👨‍⚕️ Doctors: ${doctors.length}`);
    console.log(`   - Cardiologist: ${doctors.filter(d => d.specialization.includes('Cardio')).length}`);
    console.log(`   - Neurologist: ${doctors.filter(d => d.specialization.includes('Neuro')).length}`);
    console.log(`   - Gastroenterologist: ${doctors.filter(d => d.specialization.includes('Gastro')).length}`);
    console.log(`   - Endocrinologist: ${doctors.filter(d => d.specialization.includes('Endocrin')).length}`);
    console.log(`   - Dermatologist: ${doctors.filter(d => d.specialization.includes('Dermat')).length}`);
    console.log(`   - Pulmonologist: ${doctors.filter(d => d.specialization.includes('Pulmon')).length}`);
    console.log(`   - Nephrologist: ${doctors.filter(d => d.specialization.includes('Nephro')).length}`);
    console.log(`   - Rheumatologist: ${doctors.filter(d => d.specialization.includes('Rheumat')).length}`);
    console.log(`   - Orthopedic: ${doctors.filter(d => d.specialization.includes('Orthoped')).length}`);
    console.log(`   - Infectious Disease: ${doctors.filter(d => d.specialization.includes('Infectious')).length}`);
    console.log(`   - Allergist: ${doctors.filter(d => d.specialization.includes('Allergist')).length}`);
    console.log(`   - General Surgeon: ${doctors.filter(d => d.specialization.includes('Surgeon')).length}`);
    console.log(`   - General Practitioner: ${doctors.filter(d => d.specialization.includes('General')).length}`);
    console.log(`   - Emergency Medicine: ${doctors.filter(d => d.specialization.includes('Emergency')).length}`);
    console.log(`   - ICU Specialist: ${doctors.filter(d => d.specialization.includes('ICU')).length}`);
    console.log(`👩‍⚕️ Nurses: ${nurses.length}`);
    console.log(`   - ICU: ${nurses.filter(n => n.ward === 'ICU').length}`);
    console.log(`   - General: ${nurses.filter(n => n.ward === 'General').length}`);
    console.log(`   - Emergency: ${nurses.filter(n => n.ward === 'Emergency').length}`);
    console.log(`   - Cardiology: ${nurses.filter(n => n.ward === 'Cardiology').length}`);
    console.log(`   - Neurology: ${nurses.filter(n => n.ward === 'Neurology').length}`);
    console.log(`   - On-Duty: ${nurses.filter(n => n.status === 'On Duty').length}`);
    console.log(`   - Off-Duty: ${nurses.filter(n => n.status === 'Off Duty').length}`);
    console.log(`👥 Staff Members: ${staffMembers.length}`);
    console.log(`   - Receptionists: ${staffMembers.filter(s => s.role === 'Receptionist').length}`);
    console.log(`   - Technicians: ${staffMembers.filter(s => s.role === 'Technician').length}`);
    console.log(`   - Admin: ${staffMembers.filter(s => s.role === 'Admin').length}`);
    console.log(`🛏️  Beds: ${beds.length}`);
    console.log(`   - Available: ${beds.filter(b => b.status === 'Available').length}`);
    console.log(`   - Occupied: ${beds.filter(b => b.status === 'Occupied').length}`);
    console.log(`🏥 Patients: ${patients.length}`);
    console.log(`   - Critical: ${patients.filter(p => p.status === 'Critical').length}`);
    console.log(`   - Stable: ${patients.filter(p => p.status === 'Stable').length}`);
    console.log(`   - Recovering: ${patients.filter(p => p.status === 'Recovering').length}`);
    console.log(`   - With Assigned Doctor: ${patients.filter(p => p.assignedDoctor).length}`);
    console.log(`   - With Assigned Bed: ${patients.filter(p => p.assignedBed).length}`);
    console.log(`   - With Assigned Nurse: ${patients.filter(p => p.assignedNurse).length}`);
    console.log(`📅 Appointments: ${appointments.length}`);
    console.log(`   - Scheduled: ${appointments.filter(a => a.status === 'Scheduled').length}`);
    console.log(`   - Confirmed: ${appointments.filter(a => a.status === 'Confirmed').length}`);
    console.log(`   - Completed: ${appointments.filter(a => a.status === 'Completed').length}`);
    console.log('═'.repeat(60));

    console.log('\n🔐 LOGIN CREDENTIALS');
    console.log('═'.repeat(60));
    console.log('Admin:');
    console.log('  Email: admin@hospital.com');
    console.log('  Password: admin123');
    console.log('\nSample Doctor:');
    console.log(`  Email: ${doctors[0].email}`);
    console.log('  Password: doctor123');
    console.log('\nAll doctors use password: doctor123');
    console.log('═'.repeat(60));

    console.log('\n✅ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('🎉 Hospital is ready with comprehensive data and auto-assignments!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedData();
