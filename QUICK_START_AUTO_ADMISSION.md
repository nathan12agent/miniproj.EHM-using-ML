# Quick Start: Auto-Admission System

## 5-Minute Setup

### Step 1: Generate Training Data
```bash
cd ml-service
python generate_synthetic_data.py
```

**Output**: Creates `data/assignment_history.csv` and `data/routing_history.csv`

### Step 2: Start ML Service
```bash
python app.py
```

**Service**: Runs on `http://localhost:5001`

### Step 3: Test the System
Open a new terminal:
```bash
cd ml-service
python test_auto_admission.py
```

Type `n` when asked about API testing (unless Flask is running).

## Test with API Call

### Using cURL
```bash
curl -X POST http://localhost:5001/auto_admit_and_assign \
  -H "Content-Type: application/json" \
  -d "{\"patient_info\": {\"name\": \"Test Patient\", \"age\": 45}, \"prediction_type\": \"symptoms\", \"symptoms\": {\"chest_pain\": 1, \"breathing_difficulty\": 1}}"
```

### Using Python
```python
import requests

data = {
    "patient_info": {"name": "Test Patient", "age": 45},
    "prediction_type": "symptoms",
    "symptoms": {
        "chest_pain": 1,
        "breathing_difficulty": 1,
        "fever": 0
    }
}

response = requests.post('http://localhost:5001/auto_admit_and_assign', json=data)
print(response.json())
```

## Expected Response

```json
{
  "success": true,
  "timestamp": "2024-02-09T10:30:00",
  "admission_summary": {
    "predicted_disease": "Heart Disease",
    "confidence": 0.87,
    "department": "Cardiology",
    "specialist_type": "Cardiologist",
    "urgency_level": "high",
    "assigned_doctor": {
      "name": "Dr. Rajesh Mehta",
      "suitability_score": 87.5
    },
    "assigned_nurse": {
      "name": "Nurse Priya Sharma",
      "suitability_score": 82.3
    }
  }
}
```

## Frontend Integration

Copy code from `admin_dashboard_snippet.html` to your admin dashboard page.

## What's Included

✅ **Disease Prediction**: Ensemble ML models
✅ **Department Routing**: Rule-based + ML classifier
✅ **Staff Assignment**: ML suitability scoring
✅ **Complete Workflow**: End-to-end automation
✅ **API Endpoints**: RESTful API
✅ **Frontend Code**: Bootstrap UI snippet
✅ **Documentation**: Comprehensive guides

## Files Created

```
ml-service/
├── routing_assigner.py              # Patient routing
├── staff_assignment.py              # Staff assignment
├── auto_admission_service.py        # Orchestrator
├── generate_synthetic_data.py       # Data generator
├── test_auto_admission.py           # Test suite
├── admin_dashboard_snippet.html     # Frontend code
└── data/
    ├── staff_data.csv              # 20 staff members
    ├── disease_department_mapping.csv  # 30 diseases
    ├── assignment_history.csv      # Training data
    └── routing_history.csv         # Training data
```

## Documentation

- **AUTO_ADMISSION_SYSTEM_GUIDE.md** - Complete system guide (2,500+ words)
- **ML_LEARNING_OBJECTIVES_COVERAGE.md** - Educational value (3,000+ words)
- **AUTO_ADMISSION_COMPLETE.md** - Implementation summary

## ML Learning Objectives

✅ **LO 2.2**: Supervised Classification with Model Comparison
- Compares 4 algorithms: Logistic Regression, Decision Tree, SVM, Random Forest

✅ **LO 2.4**: Ensemble Methods
- Weighted voting ensemble for disease prediction
- Random Forest for staff assignment

🔄 **LO 3.2**: Clustering (Optional)
- Guide provided for K-Means staff grouping

## Troubleshooting

**Issue**: Models not loading
**Fix**: Run `python generate_synthetic_data.py`

**Issue**: API connection error
**Fix**: Ensure Flask app is running on port 5001

**Issue**: No available staff
**Fix**: Update `data/staff_data.csv` with more staff

## Next Steps

1. ✅ System is working with rule-based fallbacks
2. 📊 (Optional) Train ML models for routing and assignment
3. 🎨 Integrate frontend using `admin_dashboard_snippet.html`
4. 🧪 Test with real patient data
5. 📈 Monitor and improve accuracy

## Support

See comprehensive documentation:
- `AUTO_ADMISSION_SYSTEM_GUIDE.md`
- `ML_LEARNING_OBJECTIVES_COVERAGE.md`

---

**Status**: ✅ Ready to Use
**Setup Time**: < 5 minutes
**Version**: 1.0.0
