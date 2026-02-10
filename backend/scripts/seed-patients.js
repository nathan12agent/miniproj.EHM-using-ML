const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Patient = require('../models/Patient');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Helper function to generate random date
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Patient data
const patientsData = [
  // Cardiac patients
  {
    patientId: 'P00001001',
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: new Date('1965-03-15'),
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '555-1001',
    email: 'john.smith@email.com',
    address: {
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Mary Smith',
      relationship: 'Wife',
      phone: '555-1002'
    },
    medicalInfo: {
      symptoms: ['chest_pain', 'fatigue', 'breathing_difficulty'],
      disease: 'Heart Disease',
      recommendedSpecialist: 'Cardiologist',
      specialistConfidence: 0.92
    },
    medicalHistory: [{
      condition: 'Hypertension',
      diagnosedDate: new Date('2020-01-15'),
      status: 'Chronic',
      notes: 'Controlled with medication'
    }],
    allergies: [{
      allergen: 'Penicillin',
      severity: 'Moderate',
      reaction: 'Rash'
    }],
    currentMedications: [{
      medication: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      startDate: new Date('2020-01-20')
    }]
  },
  {
    patientId: 'P00001002',
    firstName: 'Emma',
    lastName: 'Johnson',
    dateOfBirth: new Date('1978-07-22'),
    gender: 'Female',
    bloodGroup: 'A+',
    phone: '555-1003',
    email: 'emma.johnson@email.com',
    address: {
      street: '456 Oak Ave',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62702',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Robert Johnson',
      relationship: 'Husband',
      phone: '555-1004'
    },
    medicalInfo: {
      symptoms: ['fever', 'cough', 'fatigue'],
      disease: 'Pneumonia',
      recommendedSpecialist: 'Pulmonologist',
      specialistConfidence: 0.88
    },
    medicalHistory: [{
      condition: 'Asthma',
      diagnosedDate: new Date('2015-05-10'),
      status: 'Chronic',
      notes: 'Mild intermittent'
    }],
    currentMedications: [{
      medication: 'Albuterol Inhaler',
      dosage: '90mcg',
      frequency: 'As needed',
      startDate: new Date('2015-05-15')
    }]
  },

  // Diabetic patients
  {
    patientId: 'P00001003',
    firstName: 'Michael',
    lastName: 'Williams',
    dateOfBirth: new Date('1972-11-08'),
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '555-1005',
    email: 'michael.williams@email.com',
    address: {
      street: '789 Elm St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62703',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Sarah Williams',
      relationship: 'Sister',
      phone: '555-1006'
    },
    medicalInfo: {
      symptoms: ['fatigue', 'frequent_urination', 'increased_thirst'],
      disease: 'Diabetes',
      recommendedSpecialist: 'Endocrinologist',
      specialistConfidence: 0.95
    },
    medicalHistory: [{
      condition: 'Type 2 Diabetes',
      diagnosedDate: new Date('2018-03-20'),
      status: 'Chronic',
      notes: 'Well controlled with medication and diet'
    }],
    bloodGroup: 'B+',
    currentMedications: [{
      medication: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      startDate: new Date('2018-03-25')
    }]
  },

  // Neurological patients
  {
    patientId: 'P00001004',
    firstName: 'Sophia',
    lastName: 'Brown',
    dateOfBirth: new Date('1985-04-12'),
    gender: 'Female',
    bloodGroup: 'AB+',
    phone: '555-1007',
    email: 'sophia.brown@email.com',
    address: {
      street: '321 Pine Rd',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62704',
      country: 'USA'
    },
    emergencyContact: {
      name: 'David Brown',
      relationship: 'Brother',
      phone: '555-1008'
    },
    medicalInfo: {
      symptoms: ['headache', 'dizziness', 'nausea'],
      disease: 'Migraine',
      recommendedSpecialist: 'Neurologist',
      specialistConfidence: 0.87
    },
    medicalHistory: [{
      condition: 'Chronic Migraine',
      diagnosedDate: new Date('2019-06-15'),
      status: 'Chronic',
      notes: 'Triggered by stress and lack of sleep'
    }],
    currentMedications: [{
      medication: 'Sumatriptan',
      dosage: '50mg',
      frequency: 'As needed',
      startDate: new Date('2019-06-20')
    }]
  },

  // Emergency cases
  {
    patientId: 'P00001005',
    firstName: 'James',
    lastName: 'Davis',
    dateOfBirth: new Date('1990-09-25'),
    gender: 'Male',
    bloodGroup: 'O-',
    phone: '555-1009',
    email: 'james.davis@email.com',
    address: {
      street: '654 Maple Dr',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62705',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Lisa Davis',
      relationship: 'Wife',
      phone: '555-1010'
    },
    medicalInfo: {
      symptoms: ['abdominal_pain', 'nausea', 'vomiting'],
      disease: 'Gastroenteritis',
      recommendedSpecialist: 'Gastroenterologist',
      specialistConfidence: 0.83
    },
    medicalHistory: [],
    allergies: [{
      allergen: 'Shellfish',
      severity: 'Severe',
      reaction: 'Anaphylaxis'
    }]
  },

  // General patients
  {
    patientId: 'P00001006',
    firstName: 'Olivia',
    lastName: 'Martinez',
    dateOfBirth: new Date('1995-12-03'),
    gender: 'Female',
    bloodGroup: 'A-',
    phone: '555-1011',
    email: 'olivia.martinez@email.com',
    address: {
      street: '987 Cedar Ln',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62706',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Carlos Martinez',
      relationship: 'Father',
      phone: '555-1012'
    },
    medicalInfo: {
      symptoms: ['skin_rash', 'itching'],
      disease: 'Fungal Infection',
      recommendedSpecialist: 'Dermatologist',
      specialistConfidence: 0.79
    },
    medicalHistory: [],
    allergies: []
  },

  {
    patientId: 'P00001007',
    firstName: 'William',
    lastName: 'Garcia',
    dateOfBirth: new Date('1968-02-18'),
    gender: 'Male',
    bloodGroup: 'B-',
    phone: '555-1013',
    email: 'william.garcia@email.com',
    address: {
      street: '147 Birch St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62707',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Maria Garcia',
      relationship: 'Wife',
      phone: '555-1014'
    },
    medicalInfo: {
      symptoms: ['joint_pain', 'stiffness', 'swelling'],
      disease: 'Arthritis',
      recommendedSpecialist: 'Rheumatologist',
      specialistConfidence: 0.91
    },
    medicalHistory: [{
      condition: 'Osteoarthritis',
      diagnosedDate: new Date('2021-08-10'),
      status: 'Chronic',
      notes: 'Affecting knees and hands'
    }],
    currentMedications: [{
      medication: 'Ibuprofen',
      dosage: '400mg',
      frequency: 'Three times daily',
      startDate: new Date('2021-08-15')
    }]
  },

  {
    patientId: 'P00001008',
    firstName: 'Ava',
    lastName: 'Rodriguez',
    dateOfBirth: new Date('2010-06-30'),
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '555-1015',
    email: 'parent.rodriguez@email.com',
    address: {
      street: '258 Willow Way',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62708',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Ana Rodriguez',
      relationship: 'Mother',
      phone: '555-1016'
    },
    medicalInfo: {
      symptoms: ['fever', 'sore_throat', 'fatigue'],
      disease: 'Common Cold',
      recommendedSpecialist: 'General Practitioner',
      specialistConfidence: 0.75
    },
    medicalHistory: [],
    allergies: []
  },

  {
    patientId: 'P00001009',
    firstName: 'Ethan',
    lastName: 'Wilson',
    dateOfBirth: new Date('1982-10-14'),
    gender: 'Male',
    bloodGroup: 'AB-',
    phone: '555-1017',
    email: 'ethan.wilson@email.com',
    address: {
      street: '369 Spruce Ave',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62709',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Jennifer Wilson',
      relationship: 'Wife',
      phone: '555-1018'
    },
    medicalInfo: {
      symptoms: ['back_pain', 'numbness', 'weakness'],
      disease: 'Herniated Disc',
      recommendedSpecialist: 'Orthopedic Surgeon',
      specialistConfidence: 0.86
    },
    medicalHistory: [{
      condition: 'Lower Back Pain',
      diagnosedDate: new Date('2022-01-05'),
      status: 'Active',
      notes: 'Chronic lower back pain'
    }],
    currentMedications: [{
      medication: 'Naproxen',
      dosage: '500mg',
      frequency: 'Twice daily',
      startDate: new Date('2022-01-10')
    }]
  },

  {
    patientId: 'P00001010',
    firstName: 'Isabella',
    lastName: 'Anderson',
    dateOfBirth: new Date('1988-05-27'),
    gender: 'Female',
    bloodGroup: 'A+',
    phone: '555-1019',
    email: 'isabella.anderson@email.com',
    address: {
      street: '741 Ash Blvd',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62710',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Thomas Anderson',
      relationship: 'Husband',
      phone: '555-1020'
    },
    medicalInfo: {
      symptoms: ['anxiety', 'insomnia', 'fatigue'],
      disease: 'Anxiety Disorder',
      recommendedSpecialist: 'Psychiatrist',
      specialistConfidence: 0.81
    },
    medicalHistory: [{
      condition: 'Generalized Anxiety Disorder',
      diagnosedDate: new Date('2020-11-20'),
      status: 'Chronic',
      notes: 'Managed with therapy and medication'
    }],
    currentMedications: [{
      medication: 'Sertraline',
      dosage: '50mg',
      frequency: 'Once daily',
      startDate: new Date('2020-11-25')
    }]
  },
];

async function seedPatients() {
  try {
    console.log('\n🌱 Starting patient seeding...\n');

    // Clear existing patients
    console.log('🗑️  Clearing existing patients...');
    await Patient.deleteMany({});
    console.log('✅ Cleared existing patients\n');

    // Insert patients
    console.log('👥 Inserting patients...');
    const patients = await Patient.insertMany(patientsData);
    console.log(`✅ Inserted ${patients.length} patients\n`);

    // Summary
    console.log('📊 PATIENT SEEDING SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`👥 Total Patients: ${patients.length}`);
    console.log('');
    console.log('By Condition:');
    console.log('   - Cardiac: 1 (Heart Disease)');
    console.log('   - Respiratory: 1 (Pneumonia)');
    console.log('   - Endocrine: 1 (Diabetes)');
    console.log('   - Neurological: 1 (Migraine)');
    console.log('   - Gastrointestinal: 1 (Gastroenteritis)');
    console.log('   - Dermatological: 1 (Fungal Infection)');
    console.log('   - Rheumatological: 1 (Arthritis)');
    console.log('   - Pediatric: 1 (Common Cold)');
    console.log('   - Orthopedic: 1 (Herniated Disc)');
    console.log('   - Psychiatric: 1 (Anxiety Disorder)');
    console.log('');
    console.log('Demographics:');
    console.log(`   - Male: ${patients.filter(p => p.gender === 'Male').length}`);
    console.log(`   - Female: ${patients.filter(p => p.gender === 'Female').length}`);
    console.log('');
    console.log('All patients have:');
    console.log('   ✅ Medical information (symptoms, disease, specialist)');
    console.log('   ✅ Contact information');
    console.log('   ✅ Emergency contacts');
    console.log('   ✅ Ready for auto-assignment');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('✅ Patient seeding completed successfully!\n');
    console.log('You can now test auto-assignment with these patients.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding patients:', error);
    process.exit(1);
  }
}

// Run the seed function
seedPatients();
