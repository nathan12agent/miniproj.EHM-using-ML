const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Nurse = require('../models/Nurse');
const Staff = require('../models/Staff');
const Bed = require('../models/Bed');
require('dotenv').config();

const seedHospitalData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('✅ Connected to MongoDB\n');

    // Create a dummy department ID (since Department model might not exist)
    const dummyDeptId = new mongoose.Types.ObjectId();

    // 1. Create Admin
    console.log('👤 Creating Admin...');
    let adminUser = await User.findOne({ email: 'admin@hospital.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Administrator',
        email: 'admin@hospital.com',
        password: 'admin123',
        role: 'Administrator',
        phone: '+1234567890',
        department: 'Administration'
      });
      console.log('✅ Admin created: admin@hospital.com / admin123');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // 2. Create Doctors (10 doctors)
    console.log('\n👨‍⚕️ Creating Doctors...');
    const doctorData = [
      { firstName: 'Sarah', lastName: 'Johnson', spec: 'Cardiology', license: 'MD001' },
      { firstName: 'Michael', lastName: 'Chen', spec: 'Neurology', license: 'MD002' },
      { firstName: 'Emily', lastName: 'Davis', spec: 'Orthopedics', license: 'MD003' },
      { firstName: 'David', lastName: 'Wilson', spec: 'Pediatrics', license: 'MD004' },
      { firstName: 'Lisa', lastName: 'Martinez', spec: 'General Medicine', license: 'MD005' },
      { firstName: 'James', lastName: 'Brown', spec: 'Emergency Medicine', license: 'MD006' },
      { firstName: 'Maria', lastName: 'Garcia', spec: 'Cardiology', license: 'MD007' },
      { firstName: 'Robert', lastName: 'Taylor', spec: 'Neurology', license: 'MD008' },
      { firstName: 'Jennifer', lastName: 'Anderson', spec: 'Pediatrics', license: 'MD009' },
      { firstName: 'William', lastName: 'Thomas', spec: 'General Medicine', license: 'MD010' }
    ];

    const doctors = [];
    for (const doc of doctorData) {
      const email = `dr.${doc.firstName.toLowerCase()}.${doc.lastName.toLowerCase()}@hospital.com`;
      
      let doctorUser = await User.findOne({ email });
      if (!doctorUser) {
        doctorUser = await User.create({
          name: `Dr. ${doc.firstName} ${doc.lastName}`,
          email,
          password: 'doctor123',
          role: 'Doctor',
          phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          department: doc.spec
        });
      }

      let doctor = await Doctor.findOne({ userId: doctorUser._id });
      if (!doctor) {
        doctor = await Doctor.create({
          userId: doctorUser._id,
          firstName: doc.firstName,
          lastName: doc.lastName,
          dateOfBirth: new Date(1975 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          phone: doctorUser.phone,
          email,
          address: {
            street: `${Math.floor(Math.random() * 999) + 1} Medical Plaza`,
            city: 'Healthcare City',
            state: 'CA',
            zipCode: '90210',
            country: 'USA'
          },
          medicalLicenseNumber: doc.license,
          specialization: doc.spec,
          qualifications: [{
            degree: 'MD',
            institution: 'Medical University',
            year: 2005 + Math.floor(Math.random() * 10),
            country: 'USA'
          }],
          experience: Math.floor(Math.random() * 15) + 5,
          department: dummyDeptId,
          consultationFee: Math.floor(Math.random() * 100) + 100,
          bio: `Experienced ${doc.spec} specialist`,
          languages: ['English'],
          status: 'Active',
          mlAccess: true,
          mlAccessGrantedDate: new Date()
        });
      }
      doctors.push(doctor);
    }
    console.log(`✅ Created/verified ${doctors.length} doctors`);

    // 3. Create Nurses (20 nurses)
    console.log('\n👩‍⚕️ Creating Nurses...');
    const nurseDepts = ['ICU', 'Emergency', 'General', 'Pediatric', 'Maternity'];
    const nurses = [];
    
    for (let i = 1; i <= 20; i++) {
      const firstName = ['Anna', 'Emma', 'Olivia', 'Sophia', 'Isabella'][Math.floor(Math.random() * 5)];
      const lastName = ['Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'][Math.floor(Math.random() * 5)];
      const ward = nurseDepts[Math.floor(Math.random() * nurseDepts.length)];
      
      let nurse = await Nurse.findOne({ email: `nurse${i}@hospital.com` });
      if (!nurse) {
        nurse = await Nurse.create({
          firstName,
          lastName,
          email: `nurse${i}@hospital.com`,
          phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          ward,
          shift: ['Morning', 'Evening', 'Night'][Math.floor(Math.random() * 3)],
          status: Math.random() > 0.3 ? 'On Duty' : 'Off Duty'
        });
      }
      nurses.push(nurse);
    }
    console.log(`✅ Created/verified ${nurses.length} nurses`);

    // 4. Create Staff (20 staff members)
    console.log('\n👥 Creating Staff Members...');
    const staffRoles = [
      { role: 'Receptionist', dept: 'Admin', count: 5 },
      { role: 'Technician', dept: 'Lab', count: 8 },
      { role: 'Technician', dept: 'Radiology', count: 4 },
      { role: 'Admin', dept: 'Admin', count: 3 }
    ];

    const staffMembers = [];
    let staffCounter = 1;

    for (const staffType of staffRoles) {
      for (let i = 0; i < staffType.count; i++) {
        const firstName = ['Alex', 'Jordan', 'Taylor', 'Morgan'][Math.floor(Math.random() * 4)];
        const lastName = ['Martin', 'Lee', 'Walker', 'Hall'][Math.floor(Math.random() * 4)];
        
        let staff = await Staff.findOne({ staffId: `STF${String(staffCounter).padStart(3, '0')}` });
        if (!staff) {
          staff = await Staff.create({
            staffId: `STF${String(staffCounter).padStart(3, '0')}`,
            name: `${firstName} ${lastName}`,
            role: staffType.role,
            department: staffType.dept,
            email: `staff${staffCounter}@hospital.com`,
            phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
            experienceYears: Math.floor(Math.random() * 8) + 1,
            specialization: [staffType.dept],
            shiftPreference: ['Day', 'Night', 'Rotating'][Math.floor(Math.random() * 3)],
            distanceFromHospital: Math.floor(Math.random() * 30) + 5,
            currentStatus: Math.random() > 0.2 ? 'On-Duty' : 'Off-Duty',
            performanceRating: Math.floor(Math.random() * 2) + 3
          });
        }
        staffMembers.push(staff);
        staffCounter++;
      }
    }
    console.log(`✅ Created/verified ${staffMembers.length} staff members`);

    // 5. Create Beds (50 beds)
    console.log('\n🛏️  Creating Beds...');
    const bedDepts = [
      { name: 'ICU', count: 10 },
      { name: 'ER', count: 8 },
      { name: 'General Ward', count: 20 },
      { name: 'Pediatrics', count: 8 },
      { name: 'Cardiology', count: 4 }
    ];

    const beds = [];
    let bedNum = 1;

    for (const dept of bedDepts) {
      for (let i = 0; i < dept.count; i++) {
        const bedNumber = `${dept.name.substring(0, 3).toUpperCase()}-${String(bedNum).padStart(3, '0')}`;
        let bed = await Bed.findOne({ bedNumber });
        if (!bed) {
          bed = await Bed.create({
            bedNumber,
            department: dept.name,
            type: dept.name === 'ICU' ? 'ICU' : (dept.name === 'ER' ? 'Emergency' : 'General'),
            status: 'Available',
            floor: Math.floor(bedNum / 10) + 1,
            room: `${Math.floor(bedNum / 2) + 1}`,
            assignedPatient: null,
            assignedNurse: null,
            lastCleaned: new Date(),
            features: ['Oxygen', 'Monitor']
          });
        }
        beds.push(bed);
        bedNum++;
      }
    }
    console.log(`✅ Created/verified ${beds.length} beds`);

    // 6. Create Patients with AUTO-ASSIGNMENT
    console.log('\n🏥 Creating Patients with Auto-Assignment...');
    const conditions = [
      { condition: 'Cardiac Arrest', dept: 'Cardiology', severity: 'Critical', needsICU: true },
      { condition: 'Stroke', dept: 'Neurology', severity: 'Critical', needsICU: true },
      { condition: 'Pneumonia', dept: 'General Ward', severity: 'Moderate', needsICU: false },
      { condition: 'Diabetes', dept: 'General Medicine', severity: 'Stable', needsICU: false },
      { condition: 'Fracture', dept: 'Orthopedics', severity: 'Moderate', needsICU: false },
      { condition: 'Fever', dept: 'Pediatrics', severity: 'Mild', needsICU: false },
      { condition: 'Chest Pain', dept: 'Cardiology', severity: 'Moderate', needsICU: false }
    ];

    const patients = [];
    const patientNames = [
      { first: 'John', last: 'Smith' },
      { first: 'Jane', last: 'Doe' },
      { first: 'Michael', last: 'Johnson' },
      { first: 'Sarah', last: 'Williams' },
      { first: 'David', last: 'Brown' },
      { first: 'Emily', last: 'Jones' },
      { first: 'Robert', last: 'Garcia' },
      { first: 'Lisa', last: 'Miller' },
      { first: 'William', last: 'Davis' },
      { first: 'Mary', last: 'Rodriguez' },
      { first: 'James', last: 'Martinez' },
      { first: 'Patricia', last: 'Hernandez' },
      { first: 'Richard', last: 'Lopez' },
      { first: 'Linda', last: 'Gonzalez' },
      { first: 'Thomas', last: 'Wilson' },
      { first: 'Barbara', last: 'Anderson' },
      { first: 'Charles', last: 'Thomas' },
      { first: 'Jennifer', last: 'Taylor' },
      { first: 'Christopher', last: 'Moore' },
      { first: 'Nancy', last: 'Jackson' }
    ];

    for (let i = 0; i < 20; i++) {
      const name = patientNames[i];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      // AUTO-ASSIGN DOCTOR
      const matchingDoctors = doctors.filter(d => 
        d.specialization === condition.dept || 
        d.specialization === 'General Medicine'
      );
      const assignedDoctor = matchingDoctors.length > 0 
        ? matchingDoctors[Math.floor(Math.random() * matchingDoctors.length)]
        : doctors[0];
      
      // AUTO-ASSIGN BED
      let assignedBed = null;
      const availableBeds = beds.filter(b => 
        b.status === 'Available' && 
        (condition.needsICU ? b.department === 'ICU' : b.department === condition.dept || b.department === 'General Ward')
      );
      
      if (availableBeds.length > 0) {
        assignedBed = availableBeds[0];
      }
      
      // AUTO-ASSIGN NURSE
      let assignedNurse = null;
      if (assignedBed) {
        const availableNurses = nurses.filter(n => 
          n.ward === assignedBed.department && 
          n.status === 'On Duty'
        );
        
        if (availableNurses.length > 0) {
          assignedNurse = availableNurses[0];
        }
      }
      
      // Create patient
      const email = `${name.first.toLowerCase()}.${name.last.toLowerCase()}${i}@email.com`;
      let patient = await Patient.findOne({ email });
      
      if (!patient) {
        patient = await Patient.create({
          name: `${name.first} ${name.last}`,
          age: Math.floor(Math.random() * 60) + 20,
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          email,
          phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          address: `${Math.floor(Math.random() * 999) + 1} Main St, City, State`,
          bloodGroup: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)],
          emergencyContact: {
            name: `${name.first} ${name.last} Jr.`,
            relationship: 'Spouse',
            phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`
          },
          medicalHistory: [condition.condition],
          currentMedications: ['Medication A'],
          allergies: Math.random() > 0.7 ? ['Penicillin'] : [],
          admissionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          status: condition.severity === 'Critical' ? 'Critical' : 'Stable',
          assignedDoctor: assignedDoctor._id,
          assignedBed: assignedBed ? assignedBed._id : null,
          assignedNurse: assignedNurse ? assignedNurse._id : null,
          department: condition.dept,
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
        
        // Update bed
        if (assignedBed) {
          assignedBed.status = 'Occupied';
          assignedBed.assignedPatient = patient._id;
          assignedBed.assignedNurse = assignedNurse ? assignedNurse._id : null;
          await assignedBed.save();
        }
        
        // Update nurse
        if (assignedNurse && assignedBed) {
          // Nurse model doesn't have assignedBeds array, so we skip this
          // assignedNurse.assignedBeds.push(assignedBed._id);
          // await assignedNurse.save();
        }
        
        // Update doctor metrics
        assignedDoctor.metrics.totalPatients += 1;
        await assignedDoctor.save();
      }
      
      patients.push(patient);
    }
    console.log(`✅ Created/verified ${patients.length} patients with auto-assignments`);

    // Summary
    console.log('\n📊 HOSPITAL DATA SUMMARY');
    console.log('═'.repeat(60));
    console.log(`👤 Admin: 1`);
    console.log(`👨‍⚕️ Doctors: ${doctors.length}`);
    console.log(`👩‍⚕️ Nurses: ${nurses.length} (${nurses.filter(n => n.status === 'On Duty').length} on-duty)`);
    console.log(`👥 Staff: ${staffMembers.length}`);
    console.log(`🛏️  Beds: ${beds.length} (${beds.filter(b => b.status === 'Occupied').length} occupied)`);
    console.log(`🏥 Patients: ${patients.length}`);
    console.log(`   - With Doctor: ${patients.filter(p => p.assignedDoctor).length}`);
    console.log(`   - With Bed: ${patients.filter(p => p.assignedBed).length}`);
    console.log(`   - With Nurse: ${patients.filter(p => p.assignedNurse).length}`);
    console.log('═'.repeat(60));
    
    console.log('\n🔐 LOGIN CREDENTIALS');
    console.log('═'.repeat(60));
    console.log('Admin: admin@hospital.com / admin123');
    console.log('Doctor: dr.sarah.johnson@hospital.com / doctor123');
    console.log('(All doctors use password: doctor123)');
    console.log('═'.repeat(60));
    
    console.log('\n✅ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('🎉 Hospital data with auto-assignments is ready!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedHospitalData();
