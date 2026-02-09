# Auto-Admission & Assignment System Guide

## Overview

The Auto-Admission System is a comprehensive ML-powered workflow that automates patient admission from disease prediction through staff assignment. This system demonstrates multiple machine learning concepts and provides practical value for hospital operations.

## System Architecture

```
Patient Input (Symptoms/Image)
         ↓
   Disease Prediction
   (Ensemble ML Models)
         ↓
   Department Routing
   (Rule-based + ML Classifier)
         ↓
   Staff Assignment
   (ML Suitability Scoring)
         ↓
   Complete Admission Result
```

## Components

### 1. Disease Prediction
- **Symptom-based**: Ensemble of Random Forest, SVM, and Gradient Boosting
- **Image-based**: Skin disease classification (CNN or Scikit-learn)
- **Output**: Predicted disease with confidence score

### 2. Department Routing (`routing_assigner.py`)
- **Rule-based mapping**: 30 diseases → departments
- **ML classifier**: For ambiguous cases
- **Consensus routing**: Multiple predictions agree on department
- **Triage fallback**: Low confidence cases

### 3. Staff Assignment (`staff_assignment.py`)
- **ML-based scoring**: RandomForestRegressor predicts suitability
- **Features**:
  - `current_load`: Number of patients (0-5)
  - `availability`: Currently available (0/1)
  - `expertise_match`: Skill match score (0-1)
  - `hours_remaining`: Hours left in shift
  - `experience_years`: Years of experience
  - `performance_score`: Historical performance (0-1)
  - `department_match`: Department alignment (0/1)
- **Output**: Best doctor and nurse with suitability scores

### 4. Auto-Admission Service (`auto_admission_service.py`)
- **Orchestrator**: Coordinates all components
- **Complete workflow**: End-to-end automation
- **Error handling**: Graceful fallbacks

## Machine Learning Learning Objectives (LOs)

### LO 2.2: Supervised Classification with Model Comparison
**Demonstrated in**: `routing_assigner.py` - `train_ml_router()`

Compares 4 classification algorithms for department routing:
- Logistic Regression
- Decision Tree
- Support Vector Machine (SVM)
- Random Forest

```python
classifiers = {
    'Logistic Regression': LogisticRegression(max_iter=1000),
    'Decision Tree': DecisionTreeClassifier(max_depth=10),
    'SVM': SVC(kernel='rbf', probability=True),
    'Random Forest': RandomForestClassifier(n_estimators=100)
}

for name, clf in classifiers.items():
    scores = cross_val_score(clf, X_train, y_train, cv=5)
    print(f"{name}: {scores.mean():.3f} accuracy")
```

**Educational Value**: Students see how different algorithms perform on the same task and learn to select the best model based on cross-validation results.

### LO 2.4: Ensemble Methods
**Demonstrated in**: 
1. `disease_predictor_enhanced.py` - Ensemble of RF, SVM, GB
2. `staff_assignment.py` - RandomForestRegressor for suitability scoring

```python
# Ensemble for disease prediction
models = {
    'Random Forest': RandomForestClassifier(n_estimators=100),
    'SVM': SVC(probability=True),
    'Gradient Boosting': GradientBoostingClassifier()
}

# Weighted voting
final_prediction = weighted_vote(predictions, weights)
```

**Educational Value**: Shows how combining multiple models improves accuracy and robustness.

### LO 3.2: Clustering (Optional)
**Potential Extension**: K-Means clustering for staff grouping

```python
# Group staff by skills/experience for team formation
from sklearn.cluster import KMeans

features = staff_data[['experience_years', 'performance_score', 'current_load']]
kmeans = KMeans(n_clusters=3, random_state=42)
staff_data['cluster'] = kmeans.fit_predict(features)
```

**Educational Value**: Demonstrates unsupervised learning for discovering natural groupings in staff data.

## API Endpoints

### POST `/auto_admit_and_assign`
Complete auto-admission workflow

**Request Body**:
```json
{
  "patient_info": {
    "name": "John Doe",
    "age": 45,
    "gender": "Male"
  },
  "prediction_type": "symptoms",
  "symptoms": {
    "fever": 1,
    "cough": 1,
    "chest_pain": 0,
    "headache": 0
  }
}
```

**Response**:
```json
{
  "success": true,
  "timestamp": "2024-02-09T10:30:00",
  "patient_info": {...},
  "workflow_steps": [
    {
      "step": 1,
      "name": "Disease Prediction",
      "result": {
        "disease": "Pneumonia",
        "confidence": 0.87
      }
    },
    {
      "step": 2,
      "name": "Department Routing",
      "result": {
        "department": "General Medicine",
        "specialist_type": "Pulmonologist",
        "urgency_level": "high"
      }
    },
    {
      "step": 3,
      "name": "Staff Assignment",
      "result": {
        "assigned_doctor": {
          "name": "Dr. Amit Kumar",
          "suitability_score": 87.5
        },
        "assigned_nurse": {
          "name": "Nurse Ravi Kumar",
          "suitability_score": 82.3
        }
      }
    }
  ],
  "admission_summary": {
    "predicted_disease": "Pneumonia",
    "confidence": 0.87,
    "department": "General Medicine",
    "assigned_doctor": {...},
    "assigned_nurse": {...}
  }
}
```

### GET `/auto_admission/info`
Get service information and status

## Setup Instructions

### 1. Generate Synthetic Training Data
```bash
cd ml-service
python generate_synthetic_data.py
```

This creates:
- `data/assignment_history.csv` (500 samples)
- `data/routing_history.csv` (300 samples)

### 2. Train ML Models

**Train Assignment Models**:
```python
from staff_assignment import get_staff_assigner
assigner = get_staff_assigner()
assigner.train_assignment_models()
```

**Train Routing Model**:
```python
from routing_assigner import get_patient_router
router = get_patient_router()
router.train_ml_router()
```

### 3. Start ML Service
```bash
python app.py
```

Service runs on `http://localhost:5001`

### 4. Test the System

**Test with cURL**:
```bash
curl -X POST http://localhost:5001/auto_admit_and_assign \
  -H "Content-Type: application/json" \
  -d '{
    "patient_info": {"name": "Test Patient", "age": 35},
    "prediction_type": "symptoms",
    "symptoms": {"fever": 1, "cough": 1, "chest_pain": 1}
  }'
```

**Test with Python**:
```python
import requests

data = {
    "patient_info": {"name": "Test Patient", "age": 35},
    "prediction_type": "symptoms",
    "symptoms": {"fever": 1, "cough": 1, "chest_pain": 1}
}

response = requests.post('http://localhost:5001/auto_admit_and_assign', json=data)
print(response.json())
```

## Frontend Integration

### Add to Admin Dashboard

1. Copy `admin_dashboard_snippet.html` content to your admin dashboard page
2. Update API endpoint URL if needed
3. Load symptoms dynamically from `/symptoms` endpoint
4. Handle image upload for skin disease prediction

### Key Features
- Patient information form
- Symptom selection (checkboxes)
- Image upload for skin conditions
- Real-time results display
- Suitability scores visualization
- Urgency level indicators

## Data Files

### `data/staff_data.csv`
Staff information with 20 members (10 doctors, 10 nurses)

**Columns**:
- `staff_id`: Unique identifier
- `name`: Staff member name
- `role`: doctor or nurse
- `department`: Department assignment
- `expertise`: Comma-separated skills
- `current_load`: Current patient count
- `availability`: 0 (unavailable) or 1 (available)
- `shift_start`, `shift_end`: Shift times
- `experience_years`: Years of experience
- `performance_score`: 0.7-1.0

### `data/disease_department_mapping.csv`
30 diseases mapped to departments

**Columns**:
- `disease`: Disease name
- `department`: Target department
- `specialist_type`: Required specialist
- `urgency_level`: low, medium, high, critical

## Workflow Details

### High Confidence Path
```
Symptoms → Disease (85% confidence) → Direct Mapping → Department → Staff Assignment
```

### Low Confidence Path
```
Symptoms → Multiple Diseases → Consensus Routing → Department → Staff Assignment → Triage Flag
```

### Ambiguous Case
```
Symptoms → Unknown Disease → Triage Department → General Physician → Manual Review
```

## Suitability Scoring Algorithm

### Rule-Based (Fallback)
```
Score = (availability × 30) +
        (low_workload × 20) +
        (expertise_match × 25) +
        (hours_remaining × 10) +
        (experience × 10) +
        (performance × 5)
```

### ML-Based (When Trained)
```
Features → StandardScaler → RandomForestRegressor → Suitability Score (0-100)
```

## Performance Metrics

### Expected Accuracy
- **Disease Prediction**: 85-95% (depends on training data)
- **Department Routing**: 90-95% (rule-based + ML)
- **Staff Assignment**: R² > 0.8 (regression task)

### Response Time
- **Complete Workflow**: < 500ms
- **Disease Prediction**: < 100ms
- **Routing**: < 50ms
- **Staff Assignment**: < 100ms

## Error Handling

### Graceful Degradation
1. **ML Model Unavailable**: Falls back to rule-based routing
2. **No Available Staff**: Returns best unavailable staff with flag
3. **Unknown Disease**: Routes to Triage department
4. **Low Confidence**: Adds triage flag for manual review

### Error Responses
```json
{
  "success": false,
  "error": "Disease predictor not available",
  "timestamp": "2024-02-09T10:30:00"
}
```

## Testing Scenarios

### Test Case 1: High Confidence Cardiac Case
```json
{
  "symptoms": {"chest_pain": 1, "breathing_difficulty": 1},
  "prediction_type": "symptoms"
}
```
**Expected**: Cardiology, Cardiologist, High urgency

### Test Case 2: Pediatric Case
```json
{
  "patient_info": {"age": 5},
  "symptoms": {"fever": 1, "cough": 1},
  "prediction_type": "symptoms"
}
```
**Expected**: Pediatrics or General Medicine

### Test Case 3: Skin Condition
```json
{
  "image": "base64_encoded_image",
  "prediction_type": "image"
}
```
**Expected**: Dermatology (if skin disease detected)

## Future Enhancements

1. **Real-time Bed Assignment**: Integrate with bed management system
2. **Queue Management**: Priority queue based on urgency
3. **Historical Analysis**: Track admission patterns
4. **Feedback Loop**: Update models based on actual outcomes
5. **Multi-language Support**: Symptom input in multiple languages
6. **Mobile App**: Patient self-admission via mobile
7. **Telemedicine Integration**: Remote consultation routing

## Troubleshooting

### Issue: Models Not Loading
**Solution**: Run `generate_synthetic_data.py` and train models

### Issue: Low Accuracy
**Solution**: Generate more training data or use real historical data

### Issue: No Available Staff
**Solution**: Update `staff_data.csv` with more staff or adjust availability

### Issue: API Timeout
**Solution**: Check ML service is running on port 5001

## Educational Notes

This system is designed for a **mini-project** demonstrating:
- **Practical ML Application**: Real-world hospital use case
- **Multiple ML Techniques**: Classification, regression, ensemble
- **Model Comparison**: Systematic evaluation of algorithms
- **End-to-End Pipeline**: From data to deployment
- **Error Handling**: Robust production-ready code
- **Documentation**: Professional-grade documentation

Students can extend this by:
- Adding more diseases and departments
- Implementing K-Means clustering for staff grouping
- Creating a feedback system to improve models
- Building a complete frontend application
- Adding real-time monitoring and alerts

## License & Credits

Created for educational purposes as part of Hospital Management System with ML integration.

**Technologies Used**:
- Python 3.x
- Flask (Web API)
- Scikit-learn (ML Models)
- Pandas (Data Processing)
- NumPy (Numerical Computing)

---

**Last Updated**: February 2024
**Version**: 1.0.0
