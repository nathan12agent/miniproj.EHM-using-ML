# Doctor Portal Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOSPITAL MANAGEMENT SYSTEM                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   Admin Portal   │         │  Doctor Portal   │
│  (Port 3000)     │         │  (Port 3000)     │
│                  │         │                  │
│  - Dashboard     │         │  - Dashboard     │
│  - Patients      │         │  - Appointments  │
│  - Doctors       │         │  - ML Detection  │
│  - Appointments  │         │  - Reports       │
│  - Beds          │         │  - Patient Info  │
│  - Inventory     │         │                  │
│  - Billing       │         │                  │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │    ┌──────────────────────┐│
         └────┤   React Frontend     ├┘
              │   (React Router)     │
              └──────────┬───────────┘
                         │
                         │ HTTP/REST API
                         │
              ┌──────────▼───────────┐
              │   Express Backend    │
              │    (Port 5000)       │
              │                      │
              │  Routes:             │
              │  - /api/auth         │
              │  - /api/doctor       │◄────┐
              │  - /api/patients     │     │
              │  - /api/appointments │     │
              └──────────┬───────────┘     │
                         │                 │
                         │                 │
         ┌───────────────┼─────────────────┤
         │               │                 │
         │               │                 │
┌────────▼────────┐  ┌──▼──────────┐  ┌──▼──────────────┐
│   MongoDB       │  │  ML Service  │  │  Testing.csv    │
│  (Port 27017)   │  │ (Port 5001)  │  │                 │
│                 │  │              │  │  132 Symptoms   │
│  Collections:   │  │  Flask API   │  │  41 Diseases    │
│  - Users        │  │  - /predict  │  │  ~2000 samples  │
│  - Doctors      │  │  - /symptoms │  │                 │
│  - Patients     │  │              │  └─────────────────┘
│  - Appointments │  │  ML Model:   │
│  - Detections   │  │  - Random    │
│  - Reports      │  │    Forest    │
└─────────────────┘  │  - 95% acc   │
                     └──────────────┘
```

## Data Flow - Disease Detection

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISEASE DETECTION WORKFLOW                    │
└─────────────────────────────────────────────────────────────────┘

1. Doctor Login
   │
   ├─► JWT Token Generated
   │   └─► Stored in localStorage
   │
2. Select Patient
   │
   ├─► GET /api/patients
   │   └─► Returns patient list
   │
3. Choose Symptoms
   │
   ├─► GET http://localhost:5001/symptoms/list
   │   └─► Returns 132 symptoms from CSV
   │
4. Enter Vital Signs
   │
   ├─► Temperature, BP, Heart Rate
   │
5. Detect Disease
   │
   ├─► POST /api/doctor/detect-disease
   │   │
   │   ├─► Backend receives request
   │   │
   │   ├─► POST http://localhost:5001/predict/disease
   │   │   │
   │   │   ├─► ML Service processes
   │   │   │   - Converts symptoms to feature vector
   │   │   │   - Runs Random Forest prediction
   │   │   │   - Calculates probabilities
   │   │   │
   │   │   └─► Returns prediction
   │   │       {
   │   │         predicted_condition: "Diabetes",
   │   │         confidence: 0.92,
   │   │         all_probabilities: {...}
   │   │       }
   │   │
   │   ├─► Backend saves to DiseaseDetection collection
   │   │
   │   └─► Returns detection result to frontend
   │
6. Generate Report
   │
   ├─► POST /api/doctor/generate-report
   │   │
   │   ├─► Includes detection data
   │   ├─► Doctor's clinical notes
   │   ├─► Medications
   │   ├─► Follow-up plan
   │   │
   │   └─► Saved to MedicalReport collection
   │
7. View Previous Reports
   │
   └─► GET /api/doctor/patient/:id/reports
       └─► Returns patient's medical history
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND COMPONENTS                         │
└─────────────────────────────────────────────────────────────────┘

App.js
  │
  ├─► Router
  │   │
  │   ├─► Public Routes
  │   │   ├─► Welcome (/)
  │   │   ├─► Login (/login)
  │   │   └─► DoctorLogin (/doctor/login)
  │   │
  │   ├─► Protected Doctor Routes
  │   │   ├─► DoctorDashboard (/doctor/dashboard)
  │   │   │   ├─► Stats Cards
  │   │   │   ├─► Appointments List
  │   │   │   └─► Recent Detections
  │   │   │
  │   │   ├─► DiseaseDetection (/doctor/disease-detection)
  │   │   │   ├─► Patient Selection
  │   │   │   ├─► Symptoms Grid (132 symptoms)
  │   │   │   ├─► Vital Signs Form
  │   │   │   └─► Prediction Results
  │   │   │
  │   │   └─► GenerateReport (/doctor/generate-report)
  │   │       ├─► Patient Summary
  │   │       ├─► Detection Summary
  │   │       ├─► Report Form
  │   │       ├─► Medications Manager
  │   │       └─► Previous Reports Sidebar
  │   │
  │   └─► Protected Admin Routes
  │       └─► Layout
  │           ├─► Dashboard
  │           ├─► Patients
  │           ├─► Doctors
  │           └─► ...
  │
  └─► Redux Store
      ├─► authSlice (user, token, isAuthenticated)
      ├─► appointmentsSlice
      └─► ...
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE COLLECTIONS                        │
└─────────────────────────────────────────────────────────────────┘

Users
├─── _id: ObjectId
├─── name: String
├─── email: String (unique)
├─── password: String (hashed)
├─── role: "Doctor" | "Administrator" | "Nurse" | ...
└─── isActive: Boolean

Doctors
├─── _id: ObjectId
├─── userId: ObjectId → Users
├─── doctorId: String (auto-generated)
├─── firstName: String
├─── lastName: String
├─── specialization: String
├─── medicalLicenseNumber: String
├─── schedule: Object
└─── consultationFee: Number

Patients
├─── _id: ObjectId
├─── patientId: String (auto-generated)
├─── firstName: String
├─── lastName: String
├─── dateOfBirth: Date
├─── medicalHistory: Array
├─── allergies: Array
└─── assignedDoctor: ObjectId → Doctors

Appointments
├─── _id: ObjectId
├─── appointmentId: String (auto-generated)
├─── patient: ObjectId → Patients
├─── doctor: ObjectId → Doctors
├─── appointmentDate: Date
├─── appointmentTime: String
├─── status: "Scheduled" | "Completed" | ...
└─── visitType: "Outpatient" | "Inpatient"

DiseaseDetections (NEW)
├─── _id: ObjectId
├─── detectionId: String (auto-generated)
├─── patient: ObjectId → Patients
├─── doctor: ObjectId → Doctors
├─── appointment: ObjectId → Appointments
├─── symptoms: [String]
├─── vitalSigns: Object
├─── predictedDisease: String
├─── confidence: Number (0-1)
├─── allProbabilities: Map<String, Number>
└─── status: "Pending" | "Confirmed" | "Rejected"

MedicalReports (NEW)
├─── _id: ObjectId
├─── reportId: String (auto-generated)
├─── patient: ObjectId → Patients
├─── doctor: ObjectId → Doctors
├─── diseaseDetection: ObjectId → DiseaseDetections
├─── diagnosis: Object
│    ├─── primary: String
│    ├─── secondary: [String]
│    ├─── mlPredicted: String
│    └─── confidence: Number
├─── treatment: Object
│    ├─── medications: Array
│    │    ├─── name: String
│    │    ├─── dosage: String
│    │    ├─── frequency: String
│    │    └─── duration: String
│    └─── advice: String
├─── followUpDate: Date
└─── status: "Draft" | "Completed" | "Reviewed"
```

## ML Model Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ML MODEL ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

Testing.csv
    │
    ├─► 132 Symptom Columns (binary: 0 or 1)
    │   - itching
    │   - skin_rash
    │   - fever
    │   - cough
    │   - ... (128 more)
    │
    └─► 1 Prognosis Column (41 diseases)
        - Fungal infection
        - Diabetes
        - Malaria
        - ... (38 more)

        ↓

Data Preprocessing
    │
    ├─► Load CSV with Pandas
    ├─► Separate features (X) and target (y)
    └─► Train/Test Split (80/20)

        ↓

Model Training
    │
    ├─► Algorithm: Random Forest Classifier
    ├─► Parameters:
    │   - n_estimators: 200
    │   - max_depth: 20
    │   - random_state: 42
    │
    └─► Training Time: ~2 seconds

        ↓

Model Evaluation
    │
    ├─► Accuracy: ~95%
    ├─► Cross-validation: 5-fold
    └─► Confusion Matrix: Available

        ↓

Model Persistence
    │
    ├─► Save to: ml-service/models/
    │   - disease_model.pkl
    │   - disease_scaler.pkl
    │   - symptom_columns.pkl
    │
    └─► Load on startup

        ↓

Prediction Pipeline
    │
    ├─► Input: Symptoms dict {symptom: 1/0}
    ├─► Convert to feature vector [132 values]
    ├─► Run prediction
    ├─► Get probabilities for all 41 classes
    └─► Return top 5 predictions with confidence
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────┘

1. Authentication Layer
   │
   ├─► JWT Token Generation
   │   - Secret key from .env
   │   - 7-day expiration
   │   - Includes user ID and role
   │
   └─► Password Hashing
       - Bcrypt with salt rounds: 10
       - Never store plain passwords

2. Authorization Layer
   │
   ├─► Role-Based Access Control (RBAC)
   │   - Doctor role → Doctor portal only
   │   - Admin role → Admin portal only
   │   - Middleware checks on every request
   │
   └─► Protected Routes
       - Frontend: ProtectedRoute component
       - Backend: auth middleware

3. API Security
   │
   ├─► CORS Configuration
   │   - Allowed origins: localhost:3000
   │   - Credentials: true
   │
   ├─► Rate Limiting
   │   - 100 requests per 15 minutes
   │   - Per IP address
   │
   └─► Input Validation
       - Express-validator
       - Sanitize user inputs

4. Database Security
   │
   ├─► MongoDB Connection
   │   - Connection string in .env
   │   - Authentication required
   │
   └─► Data Validation
       - Mongoose schemas
       - Required fields
       - Type checking
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT STRUCTURE                          │
└─────────────────────────────────────────────────────────────────┘

Development Environment
    │
    ├─► Frontend: localhost:3000
    ├─► Backend: localhost:5000
    ├─► ML Service: localhost:5001
    └─► MongoDB: localhost:27017

Production Environment (Recommended)
    │
    ├─► Frontend: Vercel / Netlify
    │   - Static build deployment
    │   - CDN distribution
    │
    ├─► Backend: Heroku / AWS / DigitalOcean
    │   - Node.js server
    │   - Environment variables
    │
    ├─► ML Service: AWS Lambda / Google Cloud Run
    │   - Serverless Python function
    │   - Auto-scaling
    │
    └─── MongoDB: MongoDB Atlas
        - Cloud database
        - Automatic backups
        - Replication
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE METRICS                           │
└─────────────────────────────────────────────────────────────────┘

Frontend
├─► Initial Load: ~2-3 seconds
├─► Route Navigation: <100ms
└─► API Calls: 200-500ms

Backend
├─► API Response Time: 50-200ms
├─► Database Queries: 10-50ms
└─► JWT Verification: <10ms

ML Service
├─► Model Loading: ~1 second (on startup)
├─► Prediction Time: 50-100ms
└─► Symptom List: <10ms

Database
├─► Read Operations: 10-30ms
├─► Write Operations: 20-50ms
└─── Indexed Queries: <10ms
```

This architecture provides a scalable, secure, and efficient system for hospital management with AI-powered disease detection capabilities.
