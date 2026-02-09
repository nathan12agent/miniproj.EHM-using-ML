# Staff Management Dashboard - Implementation Guide

## Quick Start

This guide provides step-by-step instructions to implement the ML-powered Staff Management Dashboard in your Hospital Management System.

---

## Phase 1: Backend Setup (30 minutes)

### Step 1: Add Staff Model to MongoDB

1. Copy `backend/models/Staff.js` to your models directory
2. The model includes:
   - Basic staff information (name, role, department, etc.)
   - ML prediction fields (absenteeismRisk, burnoutRisk, cluster)
   - Historical data (shiftHistory, absenceHistory)

### Step 2: Add Admin Routes

1. Copy `backend/routes/admin_staff.js` to your routes directory
2. Register the routes in `backend/server.js`:

```javascript
const adminStaffRoutes = require('./routes/admin_staff');
app.use('/api/admin/staff', adminStaffRoutes);
```

### Step 3: Update Authentication Middleware

Ensure your `backend/middleware/auth.js` has a `requireAdmin` function:

```javascript
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };
```

---

## Phase 2: ML Service Setup (45 minutes)

### Step 1: Install Python Dependencies

```bash
cd ml-service
pip install scikit-learn pandas numpy flask flask-cors
```

### Step 2: Add Staff Predictor

1. Copy `ml-service/staff_predictor.py` to your ml-service directory
2. Copy `ml-service/staff_ml_routes.py` to your ml-service directory

### Step 3: Update ML Service App

Add to `ml-service/app.py`:

```python
from staff_ml_routes import register_staff_routes

# After initializing Flask app
register_staff_routes(app)
```

### Step 4: Train Initial Models

```bash
cd ml-service
python -c "from staff_predictor import get_staff_predictor; get_staff_predictor()"
```

This will:
- Generate synthetic training data
- Train 4 ML models (absenteeism, staffing, clustering, burnout)
- Save models to `models/staff/` directory
- Display training metrics

Expected output:
```
🔄 Generating synthetic training data...
📊 Training Absenteeism Prediction Models...
   Logistic Regression: 0.785 accuracy
   Decision Tree: 0.812 accuracy
   SVM: 0.798 accuracy
   Random Forest: 0.845 accuracy
✅ Best model: Random Forest (0.845)
...
✅ All models trained and saved successfully!
```

---

## Phase 3: Frontend Setup (60 minutes)

### Step 1: Install React Dependencies

```bash
cd frontend
npm install react-bootstrap bootstrap react-icons axios chart.js react-chartjs-2
```

### Step 2: Add Staff Management Page

1. Copy `frontend/src/pages/StaffManagement/StaffManagement.js`
2. Copy `frontend/src/pages/StaffManagement/StaffManagement.css`

### Step 3: Add Route to App

In `frontend/src/App.js`:

```javascript
import StaffManagement from './pages/StaffManagement/StaffManagement';

// Inside your Routes
<Route 
  path="/admin/staff" 
  element={
    <ProtectedRoute requiredRole="admin">
      <StaffManagement />
    </ProtectedRoute>
  } 
/>
```

### Step 4: Add Navigation Link

In your admin sidebar/navigation:

```javascript
<Nav.Link href="/admin/staff">
  <FaUsers className="me-2" />
  Staff Management
</Nav.Link>
```

---

## Phase 4: Seed Sample Data (15 minutes)

Create `backend/scripts/seed-staff.js`:

```javascript
const mongoose = require('mongoose');
const Staff = require('../models/Staff');

const sampleStaff = [
  {
    staffId: 'STF001',
    name: 'Dr. Sarah Johnson',
    role: 'Doctor',
    department: 'ICU',
    email: 'sarah.johnson@hospital.com',
    phone: '+1234567890',
    experienceYears: 8,
    specialization: ['Critical Care', 'Internal Medicine'],
    shiftPreference: 'Day',
    distanceFromHospital: 12,
    currentStatus: 'On-Duty',
    performanceRating: 5
  },
  {
    staffId: 'STF002',
    name: 'Nurse Emily Davis',
    role: 'Nurse',
    department: 'ER',
    email: 'emily.davis@hospital.com',
    phone: '+1234567891',
    experienceYears: 3,
    specialization: ['Emergency Care'],
    shiftPreference: 'Rotating',
    distanceFromHospital: 8,
    currentStatus: 'On-Duty',
    performanceRating: 4
  },
  // Add more staff...
];

async function seedStaff() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hospital_db');
    await Staff.deleteMany({}); // Clear existing
    await Staff.insertMany(sampleStaff);
    console.log('✅ Staff data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding staff:', error);
    process.exit(1);
  }
}

seedStaff();
```

Run:
```bash
node backend/scripts/seed-staff.js
```

---

## Phase 5: Testing (30 minutes)

### Test 1: Backend API

```bash
# Get all staff
curl http://localhost:3000/api/admin/staff \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get KPIs
curl http://localhost:3000/api/admin/staff/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test 2: ML Service

```bash
# Test absenteeism prediction
curl -X POST http://localhost:5001/ml/staff/predict_absenteeism \
  -H "Content-Type: application/json" \
  -d '{
    "staff_features": {
      "absence_last_7_days": 0,
      "absence_last_30_days": 1,
      "shift_type": 0,
      "distance_km": 10,
      "experience_years": 5,
      "department_workload": 15,
      "day_of_week": 1,
      "is_weekend": 0,
      "is_holiday": 0,
      "season": 2,
      "consecutive_shifts": 3
    }
  }'

# Test staffing prediction
curl -X POST http://localhost:5001/ml/staff/predict_staffing \
  -H "Content-Type: application/json" \
  -d '{
    "department": "ICU",
    "admissions_last_7_days": 45,
    "admissions_last_30_days": 180
  }'
```

### Test 3: Frontend

1. Login as admin
2. Navigate to `/admin/staff`
3. Verify:
   - KPI cards display correctly
   - Staff table loads
   - Filters work
   - "Run ML Predictions" button works
   - Risk badges display

---

## Phase 6: Integration with Existing System (Optional)

### Connect to Real Patient Data

Update staffing prediction to use actual admission data:

```javascript
// In backend route
router.get('/api/admin/staff/predict-needs', async (req, res) => {
  const admissionsLast7Days = await Patient.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });
  
  const admissionsLast30Days = await Patient.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });
  
  // Call ML service with real data
  const response = await axios.post('http://localhost:5001/ml/staff/predict_staffing', {
    admissions_last_7_days: admissionsLast7Days,
    admissions_last_30_days: admissionsLast30Days
  });
  
  res.json(response.data);
});
```

### Track Actual Shift Data

Add shift tracking to update ML features:

```javascript
// When staff clocks in/out
router.post('/api/staff/clock-in', async (req, res) => {
  const staff = await Staff.findById(req.user.staffId);
  
  staff.shiftHistory.push({
    date: new Date(),
    shift: req.body.shift,
    hoursWorked: 0, // Update on clock-out
    patientLoad: 0
  });
  
  staff.currentStatus = 'On-Duty';
  await staff.save();
  
  res.json({ success: true });
});
```

---

## ML Course Learning Outcomes Demonstration

### LO 2.2: Supervised Classification ✅

**Absenteeism Prediction**:
- Implemented 4 classification algorithms
- Compared performance metrics
- Selected best model (Random Forest)
- Binary classification (Present/Absent)

**Burnout Risk**:
- Multi-class classification (Low/Medium/High)
- Random Forest with class balancing
- Feature importance analysis

**Code Example**:
```python
# Compare 4 classifiers
models = {
    'Logistic Regression': LogisticRegression(),
    'Decision Tree': DecisionTreeClassifier(),
    'SVM': SVC(probability=True),
    'Random Forest': RandomForestClassifier()
}

for name, model in models.items():
    model.fit(X_train, y_train)
    score = model.score(X_test, y_test)
    print(f"{name}: {score:.3f}")
```

### LO 2.4: Ensemble Methods ✅

**Random Forest Usage**:
- Absenteeism: RandomForestClassifier (100 trees)
- Staffing: RandomForestRegressor (200 trees)
- Burnout: RandomForestClassifier (100 trees)

**Demonstrates**:
- Bagging technique
- Reduced overfitting
- Feature importance
- Better generalization

### LO 3.2: Clustering ✅

**K-Means Clustering**:
- Groups staff into 5 clusters
- Based on skills, experience, preferences
- Elbow method for optimal K
- Cluster interpretation

**Code Example**:
```python
kmeans = KMeans(n_clusters=5, random_state=42)
kmeans.fit(X_scaled)

cluster_labels = {
    0: "Senior Specialists",
    1: "Junior Generalists",
    2: "Night Shift Experts",
    3: "Part-Time Staff",
    4: "High Performers"
}
```

### LO 2.1: Regression ✅

**Staffing Needs Prediction**:
- Random Forest Regressor
- Predicts continuous value (staff count)
- Time-series features
- MAE evaluation metric

---

## Troubleshooting

### Issue: ML models not loading

**Solution**:
```bash
cd ml-service
python -c "from staff_predictor import get_staff_predictor; p = get_staff_predictor(); p.train_models_with_synthetic_data()"
```

### Issue: CORS errors

**Solution**: Ensure CORS is enabled in `ml-service/app.py`:
```python
from flask_cors import CORS
CORS(app)
```

### Issue: Authentication fails

**Solution**: Check JWT token in localStorage:
```javascript
console.log(localStorage.getItem('token'));
```

### Issue: Predictions return N/A

**Solution**: Run ML predictions first:
```bash
curl -X POST http://localhost:5001/ml/staff/predict_absenteeism \
  -H "Content-Type: application/json" \
  -d '{"staff_list": [...]}'
```

---

## Performance Optimization

### Database Indexing

Already included in Staff model:
```javascript
staffSchema.index({ role: 1, department: 1 });
staffSchema.index({ currentStatus: 1 });
staffSchema.index({ 'absenteeismRisk.riskLevel': 1 });
```

### Caching ML Predictions

Add Redis caching:
```python
import redis
r = redis.Redis(host='localhost', port=6379)

def predict_with_cache(staff_id, features):
    cache_key = f"prediction:{staff_id}"
    cached = r.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    prediction = model.predict(features)
    r.setex(cache_key, 3600, json.dumps(prediction))  # 1 hour cache
    return prediction
```

---

## Next Steps

1. **Add Charts**: Integrate Chart.js for visualizations
2. **Real-time Updates**: Use WebSockets for live dashboard
3. **Mobile App**: Create React Native version
4. **Advanced ML**: Try LSTM for time-series predictions
5. **A/B Testing**: Compare different ML models in production

---

## Support

For issues or questions:
- Check `docs/STAFF_MANAGEMENT_ML_SPEC.md` for detailed specifications
- Review ML model training logs in `ml-service/models/staff/metadata.json`
- Test API endpoints using Postman collection (create one!)

---

**Estimated Total Implementation Time**: 3-4 hours

**Difficulty Level**: Intermediate

**Prerequisites**:
- Basic React knowledge
- Flask/Python experience
- MongoDB familiarity
- ML concepts understanding

---

✅ **You're ready to build an advanced, ML-powered Staff Management Dashboard!**
