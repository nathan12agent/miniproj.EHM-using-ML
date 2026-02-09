# Auto-Assignment Implementation Guide

## Overview
Complete ML-powered auto-assignment system that automatically assigns doctors, nurses, and beds to patients based on their symptoms or disease.

## System Architecture

### 1. Backend Components

#### Patient Model (`backend/models/Patient.js`)
- Added `autoAssignment` field to store ML assignment metadata:
  - `isAutoAssigned`: Boolean flag
  - `predictedDisease`: Disease predicted by ML
  - `diseaseConfidence`: Confidence score (0-1)
  - `assignedDepartment`: Department assigned by routing
  - `assignedSpecialistType`: Type of specialist needed
  - `urgencyLevel`: low/medium/high/critical
  - `assignedDoctor`: Reference to Doctor
  - `assignedNurse`: Reference to Nurse
  - `assignedBed`: Reference to Bed
  - `doctorConfidence`: ML confidence for doctor match
  - `nurseConfidence`: ML confidence for nurse match
  - `assignmentTimestamp`: When assignment occurred
  - `assignmentMethod`: 'ml_auto' or 'manual'

#### Auto-Assignment Endpoint (`backend/routes/patients.js`)
**POST** `/api/patients/:id/auto-assign`

**Request Body:**
```json
{
  "prediction_type": "symptoms" | "disease",
  "symptoms": { "fever": 1, "cough": 1, ... },
  "disease": "Heart Disease"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Auto-assignment completed successfully",
  "patient": { ... },
  "assignments": {
    "doctor": {
      "id": "...",
      "name": "Dr. John Smith",
      "specialization": "Cardiology",
      "confidence": 0.95
    },
    "nurse": {
      "id": "...",
      "name": "Jane Doe",
      "ward": "ICU",
      "confidence": 0.88
    },
    "bed": {
      "id": "...",
      "bedNumber": "ICU-101",
      "ward": "ICU"
    },
    "disease": "Heart Disease",
    "department": "Cardiology",
    "urgency": "high"
  }
}
```

**Process Flow:**
1. Calls ML service `/auto_admit_and_assign` endpoint
2. Receives disease prediction, department routing, and staff recommendations
3. Finds and assigns actual doctor from database
4. Finds and assigns actual nurse from database
5. Finds available bed in assigned department
6. Updates bed status to "Occupied"
7. Adds patient to nurse's assigned patients list
8. Saves all assignment metadata to patient record
9. Returns complete assignment details

### 2. Frontend Components

#### API Service (`frontend/src/services/api.js`)
Added `autoAssign` method to `patientsAPI`:
```javascript
autoAssign: (id, data) => api.post(`/patients/${id}/auto-assign`, data)
```

#### Patient Form (`frontend/src/components/PatientFormEnhanced.js`)
- Integrated AI specialist recommendation
- Automatically triggers auto-assignment when patient is created with symptoms/disease
- Shows success toast notification with assignment details
- Calls backend endpoint instead of ML service directly

#### Bed Management Widget (`frontend/src/components/BedManagementWidget.js`)

**New Features:**

1. **Auto-Assign Button on Patient Cards**
   - Each patient without a bed now has a "🤖 Auto-Assign" button
   - Clicking triggers ML-powered assignment
   - Shows success notification with assigned resources
   - Automatically refreshes data to show updated assignments

2. **AI Auto-Assigned Patients Section**
   - New section displaying all ML-assigned patients
   - Comprehensive table showing:
     - Patient name and ID
     - Predicted disease (chip)
     - Assigned department and specialist type
     - Assigned doctor with confidence score
     - Assigned nurse with confidence score
     - Assigned bed status
     - Urgency level (color-coded)
     - Disease prediction confidence
     - Assignment timestamp
   - Color-coded urgency levels:
     - Critical: Red
     - High: Orange
     - Medium: Blue
     - Low: Default
   - Confidence scores displayed as percentage badges
   - Responsive table design with hover effects

3. **Manual Trigger Function**
   ```javascript
   handleAutoAssignPatient(patient)
   ```
   - Validates patient has symptoms or disease info
   - Prepares data for ML service
   - Calls auto-assignment API
   - Shows success/error notifications
   - Refreshes all data

## ML Service Integration

### Workflow
1. **Disease Prediction** (ML Service)
   - Symptom-based: Ensemble classifier (RF, SVM, GB)
   - Image-based: CNN for skin diseases
   - Returns: disease, confidence, top predictions

2. **Department Routing** (ML Service)
   - Rule-based + ML routing
   - Maps disease to department and specialist type
   - Determines urgency level
   - Returns: department, specialist_type, urgency_level

3. **Staff Assignment** (ML Service)
   - ML suitability scoring using Random Forest
   - Considers: experience, workload, specialization, availability
   - Returns: best doctor and nurse with confidence scores

4. **Resource Assignment** (Backend)
   - Finds actual staff members in database
   - Assigns available bed in correct department
   - Updates all database records
   - Stores complete assignment metadata

## Usage Guide

### For New Patients (Automatic)
1. Open "Add Patient" form
2. Fill in basic information
3. Go to "Medical Information (AI-Powered)" section
4. Choose input method:
   - **Enter Symptoms**: Select from 14 common symptoms
   - **Known Disease**: Enter disease name directly
5. Click "Get AI Specialist Recommendation"
6. Review recommendation (specialist, confidence, reasoning)
7. Click "Add Patient & Auto-Assign Staff"
8. System automatically:
   - Creates patient record
   - Predicts disease (if symptoms provided)
   - Routes to correct department
   - Assigns best doctor
   - Assigns best nurse
   - Assigns available bed
   - Shows success notification

### For Existing Patients (Manual Trigger)
1. Go to "Bed Management" page
2. Scroll to "Patients Without Beds" section
3. Find patient card
4. Click "🤖 Auto-Assign" button
5. System automatically assigns doctor, nurse, and bed
6. View results in "AI Auto-Assigned Patients" section

### Viewing Auto-Assignments
1. Go to "Bed Management" page
2. Scroll to "🤖 AI Auto-Assigned Patients" section
3. View comprehensive table with:
   - All auto-assigned patients
   - Predicted diseases
   - Assigned resources
   - Confidence scores
   - Urgency levels
   - Assignment timestamps

## Key Features

### ✅ Fully Automated
- No manual intervention required
- Assigns doctor, nurse, AND bed
- Updates all database records
- Maintains referential integrity

### ✅ ML-Powered
- Disease prediction from symptoms
- Intelligent department routing
- Staff suitability scoring
- Confidence metrics for transparency

### ✅ User-Friendly
- One-click auto-assignment
- Clear visual feedback
- Success/error notifications
- Comprehensive assignment display

### ✅ Robust Error Handling
- Validates patient data
- Handles ML service unavailability
- Provides fallback options
- Clear error messages

## Testing

### Test Auto-Assignment
1. Create a new patient with symptoms:
   - Symptoms: fever, chest_pain, breathing_difficulty
   - Expected: Cardiology department, Cardiologist
2. Check "Patients Without Beds" section
3. Click "🤖 Auto-Assign" button
4. Verify:
   - Success notification appears
   - Patient moves to "AI Auto-Assigned Patients" section
   - Doctor, nurse, and bed are assigned
   - Bed status changes to "Occupied"
   - Nurse's patient list is updated

### Test Different Scenarios
- **High Urgency**: chest_pain, breathing_difficulty → ICU
- **Low Urgency**: headache, fatigue → General ward
- **Specific Disease**: "Diabetes" → Endocrinology
- **Skin Condition**: skin_rash, itching → Dermatology

## Configuration

### Environment Variables
```bash
# Backend (.env)
ML_SERVICE_URL=http://localhost:5001

# Frontend (.env)
REACT_APP_API_URL=http://localhost:5000/api
```

### ML Service
Ensure ML service is running on port 5001:
```bash
cd ml-service
python app.py
```

## Troubleshooting

### Auto-Assignment Not Working
1. Check ML service is running: `http://localhost:5001/health`
2. Verify patient has symptoms or disease info
3. Check backend logs for errors
4. Ensure doctors, nurses, and beds exist in database

### No Available Resources
- **No Doctor**: Add doctors with appropriate specializations
- **No Nurse**: Add nurses with status "On Duty"
- **No Bed**: Add beds with status "Available"

### Low Confidence Scores
- Normal for ambiguous symptoms
- System still assigns best available match
- Consider adding more specific symptoms

## Future Enhancements
- [ ] Bed preference based on patient condition
- [ ] Real-time availability checking
- [ ] Assignment optimization algorithms
- [ ] Historical assignment analytics
- [ ] Automated reassignment on discharge
- [ ] Multi-criteria optimization (cost, quality, availability)

## Summary
The auto-assignment system is now fully functional with:
- ✅ Backend endpoint for auto-assignment
- ✅ ML service integration
- ✅ Actual resource assignment (doctor, nurse, bed)
- ✅ Database updates
- ✅ Manual trigger button in UI
- ✅ Comprehensive assignment display
- ✅ Success/error notifications
- ✅ Confidence score tracking
