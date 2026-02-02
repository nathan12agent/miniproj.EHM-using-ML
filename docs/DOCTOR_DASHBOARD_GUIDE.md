# Doctor Dashboard Guide

## Overview
The Doctor Dashboard is a separate portal designed specifically for doctors to manage their appointments, detect diseases using ML, and generate medical reports.

## Features

### 1. **Separate Doctor Login**
- Dedicated login portal at `/doctor/login`
- Role-based authentication (only users with "Doctor" role can access)
- Secure JWT-based authentication

### 2. **Doctor Dashboard**
- View today's appointments
- Track completed consultations
- See total patients
- Quick access to disease detection
- Recent disease detection history

### 3. **ML-Based Disease Detection**
- Select patient from dropdown
- Choose symptoms from comprehensive list (based on CSV data)
- Input vital signs (temperature, blood pressure, heart rate)
- Get AI-powered disease predictions with confidence scores
- View top 5 possible diagnoses

### 4. **Medical Report Generation**
- Auto-populate data from disease detection
- Add chief complaint and present illness
- Document physical examination findings
- Prescribe medications with dosage and frequency
- Set follow-up appointments
- View patient's previous reports
- Save reports to database

### 5. **Previous Reports Access**
- View all previous reports for a patient
- See diagnosis history
- Track treatment progression

## Setup Instructions

### 1. Install Dependencies

Backend:
```bash
cd backend
npm install
```

Frontend:
```bash
cd frontend
npm install
```

ML Service:
```bash
cd ml-service
pip install flask flask-cors pandas numpy scikit-learn joblib
```

### 2. Seed Doctor Data

Run the seed script to create a test doctor account:
```bash
seed-doctor.cmd
```

This creates:
- **Email:** doctor@hospital.com
- **Password:** doctor123

### 3. Start Services

Start all services in separate terminals:

**Backend:**
```bash
start-backend.cmd
```

**Frontend:**
```bash
start-frontend.cmd
```

**ML Service:**
```bash
cd ml-service
python app.py
```

### 4. Access Doctor Portal

1. Navigate to `http://localhost:3000/doctor/login`
2. Login with credentials:
   - Email: doctor@hospital.com
   - Password: doctor123
3. You'll be redirected to the doctor dashboard

## Using the Disease Detection System

### Step 1: Select Patient
1. Go to Disease Detection page
2. Select a patient from the dropdown
3. Patient information will be displayed

### Step 2: Select Symptoms
1. Use the search bar to find symptoms
2. Click on symptoms to select them
3. Selected symptoms appear as tags below
4. You can remove symptoms by clicking the × button

### Step 3: Enter Vital Signs
1. Temperature (°F)
2. Blood Pressure (Systolic/Diastolic)
3. Heart Rate (bpm)
4. Respiratory Rate (optional)

### Step 4: Detect Disease
1. Click "Detect Disease" button
2. ML model analyzes symptoms and vitals
3. Results show:
   - Predicted disease
   - Confidence percentage
   - Top 5 possible diagnoses

### Step 5: Generate Report
1. Click "Generate Report" button
2. Fill in additional details:
   - Chief complaint
   - Present illness
   - Physical examination
   - Treatment plan
3. Add medications with dosage
4. Set follow-up date
5. Save report

## CSV-Based Disease Detection

The system uses the `Testing.csv` file for disease prediction:

### CSV Format
- **Columns:** 132 symptom columns + 1 prognosis column
- **Symptoms:** Binary values (0 or 1)
- **Diseases:** 41 different conditions

### Supported Diseases
- Fungal infection
- Allergy
- GERD
- Chronic cholestasis
- Drug Reaction
- Peptic ulcer disease
- AIDS
- Diabetes
- Gastroenteritis
- Bronchial Asthma
- Hypertension
- Migraine
- Cervical spondylosis
- Paralysis
- Jaundice
- Malaria
- Chicken pox
- Dengue
- Typhoid
- Hepatitis (A, B, C, D, E)
- Alcoholic hepatitis
- Tuberculosis
- Common Cold
- Pneumonia
- Heart attack
- Varicose veins
- Hypothyroidism
- Hyperthyroidism
- Hypoglycemia
- Osteoarthritis
- Arthritis
- Vertigo
- Acne
- Urinary tract infection
- Psoriasis
- Impetigo

### ML Model Details
- **Algorithm:** Random Forest Classifier
- **Features:** 132 symptoms
- **Training:** Automatic on first run
- **Accuracy:** ~95% (based on test data)
- **Model Storage:** `ml-service/models/`

## API Endpoints

### Doctor Routes (`/api/doctor`)

#### Get Appointments
```
GET /api/doctor/appointments?date=2024-01-01&status=Scheduled
Authorization: Bearer <token>
```

#### Get Dashboard Stats
```
GET /api/doctor/dashboard/stats
Authorization: Bearer <token>
```

#### Detect Disease
```
POST /api/doctor/detect-disease
Authorization: Bearer <token>
Body: {
  patientId: "...",
  symptoms: ["fever", "cough", "fatigue"],
  vitalSigns: {
    temperature: 101.5,
    bloodPressureSystolic: 130,
    bloodPressureDiastolic: 85,
    heartRate: 95
  }
}
```

#### Generate Report
```
POST /api/doctor/generate-report
Authorization: Bearer <token>
Body: {
  patient: "...",
  diseaseDetection: "...",
  diagnosis: {...},
  treatment: {...}
}
```

#### Get Patient Reports
```
GET /api/doctor/patient/:patientId/reports
Authorization: Bearer <token>
```

### ML Service Routes

#### Predict Disease
```
POST http://localhost:5001/predict/disease
Body: {
  symptoms: ["fever", "cough", "fatigue"],
  age: 35,
  gender: "Male",
  temperature: 101.5
}
```

#### Get Symptoms List
```
GET http://localhost:5001/symptoms/list
```

## Database Models

### DiseaseDetection
```javascript
{
  detectionId: String,
  patient: ObjectId,
  doctor: ObjectId,
  symptoms: [String],
  vitalSigns: Object,
  predictedDisease: String,
  confidence: Number,
  allProbabilities: Map,
  status: String
}
```

### MedicalReport
```javascript
{
  reportId: String,
  patient: ObjectId,
  doctor: ObjectId,
  diseaseDetection: ObjectId,
  diagnosis: Object,
  treatment: {
    medications: Array,
    advice: String
  },
  followUpDate: Date,
  status: String
}
```

## Troubleshooting

### ML Service Not Starting
1. Check Python installation: `python --version`
2. Install dependencies: `pip install -r requirements.txt`
3. Verify CSV file exists: `Testing.csv` in root directory

### Disease Detection Fails
1. Check ML service is running on port 5001
2. Verify CSV file is properly formatted
3. Check browser console for errors
4. Ensure backend can connect to ML service

### Login Issues
1. Run seed-doctor script
2. Check MongoDB connection
3. Verify user role is "Doctor"
4. Clear browser cache and localStorage

### Reports Not Saving
1. Check MongoDB connection
2. Verify all required fields are filled
3. Check backend logs for errors
4. Ensure doctor profile exists

## Security Features

- JWT-based authentication
- Role-based access control
- Protected routes
- Secure password hashing
- CORS configuration
- Input validation

## Future Enhancements

1. **Image Upload:** Add medical images to reports
2. **Voice Notes:** Record consultation notes
3. **Prescription Templates:** Quick prescription generation
4. **Patient History Timeline:** Visual timeline of patient visits
5. **Telemedicine:** Video consultation integration
6. **Lab Integration:** Direct lab test ordering
7. **Drug Interaction Checker:** Medication safety checks
8. **Clinical Decision Support:** Evidence-based recommendations

## Support

For issues or questions:
1. Check the logs in backend and ML service
2. Review the browser console for frontend errors
3. Verify all services are running
4. Check database connectivity

## Credits

- Disease detection powered by Machine Learning
- CSV dataset with 41 diseases and 132 symptoms
- Built with React, Node.js, Flask, and MongoDB
