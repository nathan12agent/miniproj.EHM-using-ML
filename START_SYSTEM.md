# Quick Start Guide - Add Doctors, Nurses, and Beds

## The Problem
Your database is empty! That's why auto-assignment fails. You need to populate it with:
- 30 Doctors (various specializations)
- 50 Nurses (various wards)
- 100 Beds (ICU, General, Emergency, etc.)

## Solution: Run the Seed Script

### Step 1: Start MongoDB

**Option A: Using Docker (Recommended)**
```bash
# 1. Start Docker Desktop (from Windows Start menu)
# 2. Wait for Docker to fully start (whale icon in system tray)
# 3. Then run:
docker-compose up -d mongodb
```

**Option B: Local MongoDB**
- Download from: https://www.mongodb.com/try/download/community
- Install and start MongoDB service
- Default connection: mongodb://localhost:27017

### Step 2: Run the Seed Script

Once MongoDB is running:

```bash
cd backend
node scripts/seed-comprehensive-hospital-data.js
```

This will create:
```
✅ 30 Doctors across 7 specializations:
   - 5 Cardiologists
   - 4 Neurologists
   - 4 Orthopedic Surgeons
   - 4 Pediatricians
   - 5 General Medicine
   - 4 Emergency Medicine
   - 4 ICU Specialists

✅ 50 Nurses across all wards:
   - ICU, General, Emergency, Pediatrics, etc.
   - ~40 On-Duty, ~10 Off-Duty

✅ 100 Beds:
   - 20 ICU beds
   - 15 Emergency beds
   - 40 General ward beds
   - 15 Pediatric beds
   - 10 Cardiology beds

✅ 60 Sample Patients (with auto-assignments)
✅ Admin user: admin@hospital.com / admin123
```

### Step 3: Start All Services

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - ML Service:**
```bash
cd ml-service
python app.py
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

### Step 4: Test Auto-Assignment

1. Login: admin@hospital.com / admin123
2. Go to "Patients" page
3. Click "Add Patient"
4. Fill in basic info
5. Add symptoms or disease in "Medical Information" section
6. Save patient
7. Go to "Bed Management" tab
8. Find patient in "Patients Without Beds"
9. Click "🤖 Auto-Assign" button
10. Patient will be assigned doctor, nurse, and bed!

## Troubleshooting

### "Cannot connect to MongoDB"
- Make sure Docker Desktop is running
- Or make sure local MongoDB service is started
- Check connection: `mongosh` (should connect without errors)

### "Seed script fails"
- Make sure MongoDB is running first
- Check backend/.env has correct MONGODB_URI
- Default: `mongodb://localhost:27017/hospital_management`

### "No doctors/nurses/beds found"
- You haven't run the seed script yet
- Run: `node backend/scripts/seed-comprehensive-hospital-data.js`

### "Auto-assignment still fails"
- Check backend console for detailed logs
- Make sure ML service is running on port 5001
- Verify patient has symptoms or disease in medicalInfo field

## Quick Commands

**Check if MongoDB is running:**
```bash
# Docker:
docker ps | findstr mongodb

# Local:
mongosh
```

**Seed the database:**
```bash
cd backend
node scripts/seed-comprehensive-hospital-data.js
```

**Start everything:**
```bash
# Terminal 1:
cd backend && npm start

# Terminal 2:
cd ml-service && python app.py

# Terminal 3:
cd frontend && npm start
```

## What the Seed Script Does

The script (`backend/scripts/seed-comprehensive-hospital-data.js`):
1. Connects to MongoDB
2. Clears existing data (fresh start)
3. Creates admin user
4. Creates 30 doctors with different specializations
5. Creates 50 nurses across all wards
6. Creates 100 beds in various departments
7. Creates 60 sample patients (some with beds, some without)
8. Creates 40 appointments
9. Prints summary of what was created

## After Seeding

You'll see output like:
```
📊 HOSPITAL DATA SUMMARY
═══════════════════════════════════════════════════════════
👤 Admin Users: 1
👨‍⚕️ Doctors: 30
   - Cardiology: 5
   - Neurology: 4
   - Orthopedics: 4
   ...
👩‍⚕️ Nurses: 50
   - On-Duty: 40
   - Off-Duty: 10
🛏️  Beds: 100
   - Available: 60
   - Occupied: 40
🏥 Patients: 60
   - With Assigned Doctor: 60
   - With Assigned Bed: 40
   - With Assigned Nurse: 40
📅 Appointments: 40
═══════════════════════════════════════════════════════════

🔐 LOGIN CREDENTIALS
Admin:
  Email: admin@hospital.com
  Password: admin123

Sample Doctor:
  Email: dr.john.smith1@hospital.com
  Password: doctor123
```

Now your system is ready to use!
