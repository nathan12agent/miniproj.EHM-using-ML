# 🏥 Hospital Management System - Quick Start

## ⚠️ IMPORTANT: Your Database is Empty!

The auto-assignment feature needs doctors, nurses, and beds in the database to work.

## 🚀 Quick Setup (3 Steps)

### Step 1: Install & Start MongoDB

**Choose ONE option:**

**Option A: Docker (Easiest)**
1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
2. Start Docker Desktop (wait for it to fully start)
3. Open terminal and run:
   ```bash
   docker-compose up -d mongodb
   ```

**Option B: Local MongoDB**
1. Download: https://www.mongodb.com/try/download/community
2. Install MongoDB Community Edition
3. Start MongoDB service (usually starts automatically)

### Step 2: Seed the Database

**Windows:**
```bash
# Double-click this file:
seed-database.bat

# OR run in terminal:
cd backend
node scripts/seed-comprehensive-hospital-data.js
```

**Mac/Linux:**
```bash
cd backend
node scripts/seed-comprehensive-hospital-data.js
```

This creates:
- ✅ 30 Doctors (Cardiologists, Neurologists, etc.)
- ✅ 50 Nurses (ICU, General, Emergency wards)
- ✅ 100 Beds (across all departments)
- ✅ 60 Sample Patients
- ✅ Admin account

### Step 3: Start the System

Open **3 separate terminals**:

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Wait for: "Server running on port 5000"

**Terminal 2 - ML Service:**
```bash
cd ml-service
python app.py
```
Wait for: "Running on http://127.0.0.1:5001"

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```
Wait for browser to open at http://localhost:3000

## 🎯 Test Auto-Assignment

1. **Login:**
   - Email: `admin@hospital.com`
   - Password: `admin123`

2. **Add a Patient:**
   - Go to "Patients" page
   - Click "Add Patient"
   - Fill in: Name, DOB, Gender, Phone
   - **Important:** Add symptoms or disease in "Medical Information" section
     - Example symptoms: chest_pain, fatigue, breathing_difficulty
     - OR disease: "Heart Disease"
   - Click "Get AI Recommendation" (should show "Cardiologist")
   - Save patient

3. **Auto-Assign:**
   - Go to "Bed Management" tab
   - Find patient in "Patients Without Beds" section
   - Click "🤖 Auto-Assign" button
   - ✅ Patient gets assigned: Doctor + Nurse + Bed!

4. **Verify:**
   - Check "AI Auto-Assigned Patients" table
   - Should show: Doctor name, Nurse name, Bed number, Department, Confidence scores

## 📊 What You'll Have After Seeding

```
👨‍⚕️ 30 Doctors:
   - 5 Cardiologists
   - 4 Neurologists  
   - 4 Orthopedic Surgeons
   - 4 Pediatricians
   - 5 General Medicine
   - 4 Emergency Medicine
   - 4 ICU Specialists

👩‍⚕️ 50 Nurses:
   - Distributed across ICU, General, Emergency, Pediatrics
   - ~40 On-Duty, ~10 Off-Duty

🛏️ 100 Beds:
   - 20 ICU beds
   - 15 Emergency beds
   - 40 General ward beds
   - 15 Pediatric beds
   - 10 Cardiology beds
   - ~60 Available, ~40 Occupied

🏥 60 Sample Patients:
   - Some already assigned to beds
   - Some waiting for assignment

👤 Admin Account:
   - Email: admin@hospital.com
   - Password: admin123
```

## 🔧 Troubleshooting

### "Cannot connect to MongoDB"
**Solution:**
- Docker: Make sure Docker Desktop is running
- Local: Make sure MongoDB service is started
- Test connection: Run `mongosh` in terminal

### "Seed script fails"
**Solution:**
- Make sure MongoDB is running FIRST
- Check `backend/.env` has: `MONGODB_URI=mongodb://localhost:27017/hospital_management`
- Try running seed script again

### "Auto-assignment fails"
**Possible causes:**
1. **Database is empty** → Run seed script
2. **Backend not running** → Start backend (port 5000)
3. **ML service not running** → Start ML service (port 5001)
4. **Patient has no medical info** → Edit patient, add symptoms or disease

**Check backend console for detailed logs:**
```
=== AUTO-ASSIGNMENT STARTED ===
Patient found: John Doe
Calling ML service...
Finding doctor with specialization: Cardiologist
Found 5 doctors with specialization matching "Cardiologist"
Assigned doctor: Dr. Sarah Johnson - Cardiology
...
=== AUTO-ASSIGNMENT COMPLETED SUCCESSFULLY ===
```

### "Always shows General Practitioner"
**Solution:**
- Disease name must match one of 100+ supported diseases
- Examples: "Heart Disease", "Diabetes", "Pneumonia", "Migraine"
- See `ml-service/specialist_recommender.py` for full list

### "Symptoms not stored with patient"
**Solution:**
- ✅ This is FIXED in the latest code
- Patient model has `medicalInfo` field
- Symptoms are stored when you save the patient
- No need to re-enter in Bed Management

## 📁 Important Files

- `backend/scripts/seed-comprehensive-hospital-data.js` - Creates all data
- `backend/routes/patients.js` - Auto-assignment endpoint (line 387)
- `backend/models/Patient.js` - Patient schema with medicalInfo
- `ml-service/specialist_recommender.py` - Disease to specialist mapping
- `frontend/src/components/BedManagementWidget.js` - Auto-assign UI

## 🎓 How Auto-Assignment Works

```
1. Patient Form
   ↓ (user enters symptoms or disease)
2. ML Service
   ↓ (predicts disease, recommends specialist)
3. Backend
   ↓ (finds doctor by specialization)
   ↓ (finds nurse by ward)
   ↓ (finds available bed)
4. Database
   ↓ (updates patient, bed, nurse records)
5. Bed Management UI
   ↓ (displays assignments with confidence scores)
```

## 🆘 Still Having Issues?

1. Check all 3 services are running:
   - Backend: http://localhost:5000
   - ML Service: http://localhost:5001
   - Frontend: http://localhost:3000

2. Check backend console for error messages

3. Make sure you ran the seed script successfully

4. Try adding a patient with clear symptoms:
   - chest_pain + fatigue → Should recommend Cardiologist
   - fever + cough → Should recommend Pulmonologist
   - headache + nausea → Should recommend Neurologist

## 📝 Next Steps

After seeding and testing:
1. Explore the sample patients in Bed Management
2. Try auto-assigning patients without beds
3. View the "AI Auto-Assigned Patients" table
4. Check confidence scores for assignments
5. Add your own patients with different symptoms

---

**Need Help?** Check the detailed guides:
- `START_SYSTEM.md` - Detailed startup instructions
- `AUTO_ASSIGNMENT_FIX_COMPLETE.md` - Technical details
- `QUICK_START_GUIDE.md` - Step-by-step troubleshooting
