# Quick Start Guide - Auto-Assignment Fix

## Problem Summary

The auto-assignment feature is failing because:
1. ❌ **Syntax error in backend code** (FIXED)
2. ❌ **MongoDB not running**
3. ❌ **Database is empty** (no doctors, nurses, beds)

## Solution Steps

### Step 1: Start MongoDB

**Option A: Using Docker (Recommended)**
```bash
# Start Docker Desktop first, then run:
docker-compose up -d mongodb

# Wait 10 seconds for MongoDB to start
timeout /t 10
```

**Option B: Install MongoDB Locally**
- Download from: https://www.mongodb.com/try/download/community
- Install and start MongoDB service
- Default connection: mongodb://localhost:27017

### Step 2: Seed the Database

Once MongoDB is running:

```bash
cd backend
node scripts/seed-comprehensive-hospital-data.js
```

This will create:
- ✅ 30 Doctors (Cardiology, Neurology, Orthopedics, etc.)
- ✅ 50 Nurses (across all wards)
- ✅ 100 Beds (ICU, General, Emergency, etc.)
- ✅ 60 Sample Patients (with auto-assignments)
- ✅ Admin user (admin@hospital.com / admin123)

### Step 3: Start the Services

**Backend:**
```bash
cd backend
npm start
# Should see: "Server running on port 5000"
# Should see: "MongoDB connected successfully"
```

**ML Service:**
```bash
cd ml-service
python app.py
# Should see: "Running on http://127.0.0.1:5001"
```

**Frontend:**
```bash
cd frontend
npm start
# Should see: "webpack compiled successfully"
# Opens browser at http://localhost:3000
```

### Step 4: Test Auto-Assignment

1. **Login:**
   - Email: admin@hospital.com
   - Password: admin123

2. **Add a New Patient:**
   - Go to "Patients" page
   - Click "Add Patient" button
   - Fill in basic info:
     - First Name: John
     - Last Name: Doe
     - Date of Birth: 1990-01-01
     - Gender: Male
     - Phone: 1234567890
   
3. **Add Medical Information:**
   - Scroll to "Medical Information" section
   - **Option A - Enter Symptoms:**
     - Select symptoms: chest_pain, fatigue, breathing_difficulty
     - Click "Get AI Recommendation"
     - Should show: "Cardiologist" with confidence score
   
   - **Option B - Enter Disease:**
     - Type disease name: "Heart Disease"
     - Click "Get AI Recommendation"
     - Should show: "Cardiologist" with confidence score
   
4. **Save Patient:**
   - Click "Save" button
   - Patient is created with medical info stored

5. **Auto-Assign in Bed Management:**
   - Go to "Bed Management" tab
   - Find patient in "Patients Without Beds" section
   - Click "🤖 Auto-Assign" button
   - System will:
     - ✅ Predict disease (if symptoms provided)
     - ✅ Assign appropriate doctor (e.g., Cardiologist)
     - ✅ Assign nurse from same ward
     - ✅ Assign available bed
   
6. **Verify Assignment:**
   - Patient moves to "AI Auto-Assigned Patients" table
   - Shows: Doctor, Nurse, Bed, Department, Urgency, Confidence scores

## Troubleshooting

### "Cannot connect to MongoDB"
- **Docker:** Start Docker Desktop, then run `docker-compose up -d mongodb`
- **Local:** Install MongoDB and start the service

### "No doctors/nurses/beds found"
- Run the seed script: `node backend/scripts/seed-comprehensive-hospital-data.js`

### "ML service unavailable"
- Start ML service: `cd ml-service && python app.py`
- Check port 5001 is not in use

### "Always shows General Practitioner"
- Check disease name matches one of 100+ supported diseases
- See `ml-service/specialist_recommender.py` for full list
- Examples: "Heart Disease", "Diabetes", "Pneumonia", "Migraine"

### "Symptoms not stored"
- ✅ FIXED - Patient model now has `medicalInfo` field
- Symptoms are stored when you save the patient

## Files Fixed

1. ✅ `backend/routes/patients.js` - Removed duplicate code, fixed syntax error
2. ✅ `backend/routes/admin_staff.js` - Fixed middleware import
3. ✅ `backend/models/Patient.js` - Added `medicalInfo` field
4. ✅ `ml-service/specialist_recommender.py` - Expanded to 100+ diseases
5. ✅ `frontend/src/components/BedManagementWidget.js` - Uses stored medical info

## Expected Behavior

### Before Auto-Assignment:
```
Patient: John Doe
Symptoms: chest_pain, fatigue, breathing_difficulty
Recommended Specialist: Cardiologist (95% confidence)
Status: No bed assigned
```

### After Auto-Assignment:
```
Patient: John Doe
Disease: Heart Disease (ML predicted, 87% confidence)
Department: Cardiology
Doctor: Dr. Sarah Johnson - Cardiologist (95% confidence)
Nurse: Anna Wilson - ICU Ward (90% confidence)
Bed: ICU-015
Urgency: High
```

## System Architecture

```
Patient Form (Frontend)
    ↓ (saves symptoms/disease)
Patient Record (MongoDB)
    ↓ (click Auto-Assign)
ML Service (Flask)
    ↓ (predicts disease, specialist, department)
Backend (Express)
    ↓ (finds doctor, nurse, bed)
Database (MongoDB)
    ↓ (updates assignments)
Bed Management UI (Frontend)
    ↓ (displays results)
```

## Next Steps

1. ✅ Start MongoDB (Docker or local)
2. ✅ Run seed script
3. ✅ Start backend, ML service, frontend
4. ✅ Test auto-assignment with new patient
5. ✅ Verify assignments in Bed Management tab

---

**Status**: Ready to test after starting MongoDB and seeding database
**Last Updated**: Context Transfer Session
