# Staff Management Dashboard - ML-Powered Module Specification

## Overview

The **Staff Management Dashboard** is an advanced admin-only module that combines traditional CRUD operations with cutting-edge ML predictions to optimize hospital staffing, predict absenteeism, prevent burnout, and improve resource allocation.

---

## 1. Purpose & Features

### Core Functionality
- **Staff CRUD Operations**: View, add, edit, delete staff records
- **Role-Based Access**: Admin-only access with authentication middleware
- **Real-time Status Tracking**: Monitor who's on-duty, on-leave, or absent

### ML-Powered Features

#### 1.1 Predictive Staffing Needs (Regression)
- **Algorithm**: Random Forest Regressor
- **Purpose**: Forecast required staff per department/shift for next 7 days
- **Input Features**: 
  - Historical patient admissions (last 30 days)
  - Day of week, month, season
  - Department type (Emergency, ICU, General Ward, etc.)
  - Previous staff-to-patient ratios
  - Holiday indicators
- **Output**: Predicted staff count per department per day
- **Business Value**: Prevent understaffing/overstaffing, optimize costs

#### 1.2 Absenteeism Risk Prediction (Binary Classification)
- **Algorithms**: Logistic Regression, Decision Tree, SVM, Random Forest (ensemble comparison)
- **Purpose**: Predict probability of staff absence for next shift
- **Input Features**:
  - Recent absence history (last 30 days)
  - Shift patterns (night/day/rotating)
  - Distance from hospital
  - Years of experience
  - Department workload
  - Season/weather indicators
  - Day of week
- **Output**: Probability score (0-100%) + Risk level (Low/Medium/High)
- **Business Value**: Proactive backup planning, reduce no-shows

#### 1.3 Staff Clustering (Unsupervised Learning)
- **Algorithm**: K-Means Clustering
- **Purpose**: Group staff by skills, experience, preferences for optimal team formation
- **Input Features**:
  - Years of experience
  - Specialization/skills (encoded)
  - Shift preferences
  - Performance ratings
  - Department history
- **Output**: 4-5 clusters (e.g., "Senior Specialists", "Junior Generalists", "Night Shift Experts", etc.)
- **Business Value**: Fair shift distribution, balanced teams

#### 1.4 Burnout Risk Assessment (Multi-class Classification)
- **Algorithm**: Random Forest Classifier
- **Purpose**: Identify staff at risk of burnout
- **Input Features**:
  - Consecutive shifts worked
  - Average hours per week (last month)
  - Night shift frequency
  - Patient load per shift
  - Time since last leave
  - Years in current role
- **Output**: Risk level (Low/Medium/High)
- **Business Value**: Prevent turnover, improve staff wellbeing

---

## 2. UI Layout & Components

### 2.1 Top Section - KPI Summary Cards
```
┌─────────────────────────────────────────────────────────────────┐
│  [Total Staff: 245]  [On-Duty: 87]  [Shortage Alert: 🔴 3 Depts] │
│  [Avg Absenteeism Risk: 12.3%]  [High Burnout Risk: 8 Staff]    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Middle Section - Interactive Staff Table
```
┌─────────────────────────────────────────────────────────────────┐
│ Search: [____]  Filter: [All Roles ▼] [All Depts ▼] [Run ML ⚡] │
├─────────────────────────────────────────────────────────────────┤
│ ID | Name | Role | Dept | Exp | Status | Absence Risk | Burnout│
│ 001| Dr. Smith | Doctor | ICU | 8y | On-Duty | 8% 🟢 | Low 🟢 │
│ 002| Nurse Jane| Nurse | ER | 3y | Off-Duty| 45% 🟡 | Med 🟡 │
│ 003| Tech Mike | Tech | Lab | 12y| On-Leave| 78% 🔴 | High🔴 │
│ ... | ... | ... | ... | ... | ... | ... | ... │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Right Sidebar - Quick Actions
```
┌──────────────────────┐
│ Quick Actions        │
├──────────────────────┤
│ [+ Add New Staff]    │
│ [📊 Run Predictions] │
│ [📅 Generate Roster] │
│ [📈 View Analytics]  │
│ [⚙️ ML Settings]     │
└──────────────────────┘
```

### 2.4 Bottom Section - Charts & Visualizations
```
┌─────────────────────────────────────────────────────────────────┐
│ Predicted vs Actual Staffing (Next 7 Days)                      │
│ [Bar Chart: Departments on X-axis, Staff count on Y-axis]       │
├─────────────────────────────────────────────────────────────────┤
│ Staff Distribution by Cluster    | Absenteeism Trend (30 Days)  │
│ [Pie Chart: 5 clusters]           | [Line Chart: Daily %]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technical Architecture

### 3.1 Frontend Stack
- **Framework**: React.js (existing)
- **UI Library**: Bootstrap 5 + Material-UI components
- **Charts**: Chart.js or Recharts
- **State Management**: Redux (existing)
- **API Client**: Axios

### 3.2 Backend Stack
- **Framework**: Flask (existing)
- **Database**: MongoDB (existing)
- **ML Service**: Separate microservice (port 5001)
- **Authentication**: JWT tokens (existing)

### 3.3 ML Service Stack
- **Framework**: scikit-learn
- **Models**:
  - RandomForestRegressor (staffing needs)
  - LogisticRegression, DecisionTreeClassifier, SVC, RandomForestClassifier (absenteeism)
  - KMeans (clustering)
  - RandomForestClassifier (burnout)
- **Data Processing**: pandas, numpy
- **Model Persistence**: joblib/pickle

---

## 4. Data Models

### 4.1 Staff Schema (MongoDB)
```javascript
{
  _id: ObjectId,
  staffId: String,
  name: String,
  role: String, // "Doctor", "Nurse", "Technician", "Receptionist"
  department: String, // "ICU", "ER", "General Ward", "Lab", etc.
  email: String,
  phone: String,
  experienceYears: Number,
  specialization: [String],
  shiftPreference: String, // "Day", "Night", "Rotating"
  distanceFromHospital: Number, // km
  currentStatus: String, // "On-Duty", "Off-Duty", "On-Leave", "Absent"
  performanceRating: Number, // 1-5
  
  // ML-related fields
  absenteeismRisk: {
    probability: Number, // 0-100
    riskLevel: String, // "Low", "Medium", "High"
    lastUpdated: Date
  },
  burnoutRisk: {
    level: String, // "Low", "Medium", "High"
    score: Number,
    lastUpdated: Date
  },
  cluster: {
    id: Number,
    label: String,
    lastUpdated: Date
  },
  
  // Historical data
  shiftHistory: [{
    date: Date,
    shift: String,
    hoursWorked: Number,
    patientLoad: Number
  }],
  absenceHistory: [{
    date: Date,
    reason: String,
    duration: Number
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### 4.2 Staffing Prediction Schema
```javascript
{
  _id: ObjectId,
  predictionDate: Date,
  targetDate: Date,
  department: String,
  predictedStaffNeeded: Number,
  actualStaffScheduled: Number,
  confidence: Number,
  modelVersion: String,
  createdAt: Date
}
```

---

## 5. API Endpoints

### 5.1 Staff CRUD Endpoints (Backend - Flask)
```
GET    /api/admin/staff                    - Get all staff (with filters)
GET    /api/admin/staff/:id                - Get single staff
POST   /api/admin/staff                    - Create new staff
PUT    /api/admin/staff/:id                - Update staff
DELETE /api/admin/staff/:id                - Delete staff
GET    /api/admin/staff/stats              - Get dashboard KPIs
```

### 5.2 ML Prediction Endpoints (ML Service - Flask)
```
POST   /ml/staff/predict_absenteeism       - Predict absenteeism for all staff
POST   /ml/staff/predict_absenteeism/:id   - Predict for single staff
POST   /ml/staff/predict_staffing          - Predict staffing needs (7 days)
POST   /ml/staff/cluster_staff             - Run K-Means clustering
POST   /ml/staff/predict_burnout           - Predict burnout risk
GET    /ml/staff/model_info                - Get ML model metadata
POST   /ml/staff/train_models              - Retrain models (admin only)
```

---

## 6. ML Model Details

### 6.1 Absenteeism Prediction Model

**Training Data Structure**:
```python
Features (X):
- absence_last_7_days: int (count)
- absence_last_30_days: int (count)
- shift_type: categorical (Day=0, Night=1, Rotating=2)
- distance_km: float
- experience_years: float
- department_workload: float (avg patients per staff)
- day_of_week: int (0-6)
- is_weekend: binary
- is_holiday: binary
- season: categorical (0-3)
- consecutive_shifts: int

Target (y):
- will_be_absent: binary (0=Present, 1=Absent)
```

**Model Comparison**:
```python
models = {
    'Logistic Regression': LogisticRegression(),
    'Decision Tree': DecisionTreeClassifier(max_depth=5),
    'SVM': SVC(probability=True, kernel='rbf'),
    'Random Forest': RandomForestClassifier(n_estimators=100)
}
# Compare accuracy, precision, recall, F1-score
# Select best model for deployment
```

### 6.2 Staffing Needs Prediction Model

**Training Data Structure**:
```python
Features (X):
- day_of_week: int
- month: int
- is_weekend: binary
- is_holiday: binary
- season: int
- patient_admissions_last_7_days: float (rolling avg)
- patient_admissions_last_30_days: float (rolling avg)
- department_type: categorical
- historical_staff_count: float (same day last week)

Target (y):
- staff_needed: int (actual staff count that day)
```

**Model**: RandomForestRegressor(n_estimators=200, max_depth=10)

### 6.3 Staff Clustering Model

**Features**:
```python
- experience_years: float (normalized)
- performance_rating: float (normalized)
- shift_preference_encoded: int
- specialization_count: int
- avg_hours_per_week: float
- night_shift_frequency: float (%)
```

**Model**: KMeans(n_clusters=5, random_state=42)

**Cluster Labels** (assigned post-training):
- Cluster 0: "Senior Specialists"
- Cluster 1: "Junior Generalists"
- Cluster 2: "Night Shift Experts"
- Cluster 3: "Part-Time Staff"
- Cluster 4: "High Performers"

### 6.4 Burnout Risk Model

**Features**:
```python
- consecutive_shifts: int
- avg_hours_per_week_last_month: float
- night_shifts_last_month: int
- avg_patient_load: float
- days_since_last_leave: int
- years_in_current_role: float
- overtime_hours_last_month: float
```

**Target**: burnout_risk (0=Low, 1=Medium, 2=High)

**Model**: RandomForestClassifier(n_estimators=100, class_weight='balanced')

---

## 7. ML Course Learning Outcomes Mapping

### LO 2.2: Supervised Classification
- **Absenteeism Prediction**: Binary classification using Logistic Regression, Decision Tree, SVM, Random Forest
- **Burnout Risk**: Multi-class classification (Low/Medium/High)
- **Demonstrates**: Model comparison, hyperparameter tuning, evaluation metrics (accuracy, precision, recall, F1)

### LO 2.4: Ensemble Methods
- **Random Forest** used in multiple models (absenteeism, staffing, burnout)
- **Demonstrates**: Bagging, feature importance, handling overfitting
- **Comparison**: Individual Decision Tree vs Random Forest ensemble

### LO 3.2: Unsupervised Learning - Clustering
- **K-Means Clustering** for staff grouping
- **Demonstrates**: Elbow method for optimal K, cluster interpretation, feature scaling

### LO 2.1: Supervised Regression
- **Staffing Needs Prediction**: Random Forest Regressor
- **Demonstrates**: Time-series features, evaluation metrics (MAE, RMSE, R²)

### Additional LOs Covered
- **Data Preprocessing**: Feature engineering, encoding, normalization
- **Model Evaluation**: Cross-validation, confusion matrix, ROC curves
- **Model Deployment**: Flask API, real-time predictions

---

## 8. Implementation Priority

### Phase 1: Core CRUD (Week 1)
- Staff model and database schema
- Basic CRUD endpoints
- Frontend table and forms
- Authentication/authorization

### Phase 2: ML Models (Week 2)
- Generate synthetic training data
- Train absenteeism model (4 algorithms)
- Train staffing prediction model
- Train clustering model
- Train burnout model

### Phase 3: ML Integration (Week 3)
- ML service endpoints
- Frontend ML prediction buttons
- Real-time dashboard updates
- Charts and visualizations

### Phase 4: Polish & Testing (Week 4)
- Error handling and fallbacks
- Performance optimization
- Unit tests and integration tests
- Documentation

---

## 9. Mock Data Strategy

Since real hospital data is sensitive, use synthetic data generation:

```python
# Generate 200 staff members with realistic distributions
- 40% Nurses, 30% Doctors, 20% Technicians, 10% Receptionists
- Experience: Normal distribution (mean=5 years, std=3)
- Departments: ICU (20%), ER (25%), General Ward (30%), Lab (15%), Admin (10%)
- Absence rate: 5-15% (varies by role and experience)
- Shift patterns: 50% Day, 30% Night, 20% Rotating
```

**Fallback Mechanism**:
```python
if ml_service_unavailable:
    return {
        'absenteeism_risk': 'N/A',
        'burnout_risk': 'N/A',
        'message': 'ML predictions unavailable. Using default values.',
        'mock_mode': True
    }
```

---

## 10. Success Metrics

### Technical Metrics
- Absenteeism prediction accuracy: >75%
- Staffing prediction MAE: <3 staff members
- Clustering silhouette score: >0.5
- API response time: <500ms

### Business Metrics
- Reduce unexpected absences by 20%
- Improve staff satisfaction scores
- Optimize staffing costs by 15%
- Reduce burnout-related turnover

---

## 11. Security & Privacy

- **Role-Based Access**: Only admins can access staff management
- **Data Anonymization**: ML models trained on anonymized data
- **Audit Logs**: Track all staff data modifications
- **GDPR Compliance**: Staff consent for ML predictions
- **Secure API**: JWT authentication, rate limiting

---

## 12. Future Enhancements

- **Deep Learning**: LSTM for time-series staffing predictions
- **NLP**: Analyze staff feedback for sentiment analysis
- **Reinforcement Learning**: Optimal shift scheduling
- **Mobile App**: Staff can view their own predictions
- **Integration**: Connect with payroll, HR systems

---

This specification provides a complete blueprint for implementing an advanced, ML-powered Staff Management Dashboard that demonstrates mastery of supervised learning, ensemble methods, and clustering while solving real-world healthcare staffing challenges.
