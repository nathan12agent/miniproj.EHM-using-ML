const mongoose = require('mongoose');
const Staff = require('../models/Staff');
require('dotenv').config();

const seedStaffData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('✅ Connected to MongoDB\n');

    console.log('👥 Creating Staff Members for Staff Management Dashboard...');
    
    const staffData = [
      // Receptionists
      { firstName: 'Alex', lastName: 'Martin', role: 'Receptionist', dept: 'Admin', shift: 'Day' },
      { firstName: 'Jordan', lastName: 'Lee', role: 'Receptionist', dept: 'Admin', shift: 'Day' },
      { firstName: 'Taylor', lastName: 'Walker', role: 'Receptionist', dept: 'Admin', shift: 'Evening' },
      { firstName: 'Morgan', lastName: 'Hall', role: 'Receptionist', dept: 'Admin', shift: 'Night' },
      { firstName: 'Casey', lastName: 'Allen', role: 'Receptionist', dept: 'Admin', shift: 'Day' },
      
      // Lab Technicians
      { firstName: 'Riley', lastName: 'Young', role: 'Technician', dept: 'Lab', shift: 'Day' },
      { firstName: 'Jamie', lastName: 'King', role: 'Technician', dept: 'Lab', shift: 'Day' },
      { firstName: 'Drew', lastName: 'Wright', role: 'Technician', dept: 'Lab', shift: 'Evening' },
      { firstName: 'Sam', lastName: 'Lopez', role: 'Technician', dept: 'Lab', shift: 'Night' },
      { firstName: 'Pat', lastName: 'Hill', role: 'Technician', dept: 'Lab', shift: 'Day' },
      { firstName: 'Chris', lastName: 'Scott', role: 'Technician', dept: 'Lab', shift: 'Rotating' },
      { firstName: 'Robin', lastName: 'Green', role: 'Technician', dept: 'Lab', shift: 'Day' },
      { firstName: 'Avery', lastName: 'Adams', role: 'Technician', dept: 'Lab', shift: 'Evening' },
      
      // Radiology Technicians
      { firstName: 'Quinn', lastName: 'Baker', role: 'Technician', dept: 'Radiology', shift: 'Day' },
      { firstName: 'Reese', lastName: 'Nelson', role: 'Technician', dept: 'Radiology', shift: 'Day' },
      { firstName: 'Sage', lastName: 'Carter', role: 'Technician', dept: 'Radiology', shift: 'Evening' },
      { firstName: 'Blake', lastName: 'Mitchell', role: 'Technician', dept: 'Radiology', shift: 'Night' },
      
      // Admin Staff
      { firstName: 'Cameron', lastName: 'Perez', role: 'Admin', dept: 'Admin', shift: 'Day' },
      { firstName: 'Dakota', lastName: 'Roberts', role: 'Admin', dept: 'Admin', shift: 'Day' },
      { firstName: 'Skylar', lastName: 'Turner', role: 'Admin', dept: 'Admin', shift: 'Day' }
    ];

    const createdStaff = [];
    
    for (let i = 0; i < staffData.length; i++) {
      const s = staffData[i];
      const staffId = `STF${String(i + 1).padStart(3, '0')}`;
      
      let staff = await Staff.findOne({ staffId });
      if (!staff) {
        staff = await Staff.create({
          staffId,
          name: `${s.firstName} ${s.lastName}`,
          role: s.role,
          department: s.dept,
          email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@hospital.com`,
          phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          experienceYears: Math.floor(Math.random() * 12) + 1,
          specialization: [s.dept],
          shiftPreference: s.shift,
          distanceFromHospital: Math.floor(Math.random() * 35) + 5,
          currentStatus: Math.random() > 0.2 ? 'On-Duty' : 'Off-Duty',
          performanceRating: Math.floor(Math.random() * 2) + 3, // 3-5
          shiftHistory: [],
          absenceHistory: []
        });
        createdStaff.push(staff);
      }
    }

    console.log(`✅ Created ${createdStaff.length} staff members`);
    console.log('\n📊 STAFF SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total Staff: ${createdStaff.length}`);
    console.log(`  - Receptionists: ${createdStaff.filter(s => s.role === 'Receptionist').length}`);
    console.log(`  - Technicians: ${createdStaff.filter(s => s.role === 'Technician').length}`);
    console.log(`  - Admin: ${createdStaff.filter(s => s.role === 'Admin').length}`);
    console.log(`  - On-Duty: ${createdStaff.filter(s => s.currentStatus === 'On-Duty').length}`);
    console.log(`  - Off-Duty: ${createdStaff.filter(s => s.currentStatus === 'Off-Duty').length}`);
    console.log('═'.repeat(60));
    
    console.log('\n✅ Staff Management data seeded successfully!');
    console.log('🎉 You can now access the Staff Management Dashboard!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding staff data:', error);
    process.exit(1);
  }
};

seedStaffData();
