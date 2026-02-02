# Doctor ML Integration Design Document

## Architecture Overview

This design document outlines the technical implementation for integrating machine learning disease prediction capabilities into the doctor portal. The system will provide secure, role-based access to AI-powered diagnostic tools while maintaining medical-grade reliability and performance.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   ML Service    │
│   (React)       │◄──►│   (Express.js)  │◄──►│   (Flask)       │
│                 │    │                 │    │                 │
│ - Doctor Login  │    │ - Authentication│    │ - Disease       │
│ - ML Dashboard  │    │ - API Routes    │    │   Prediction    │
│ - Predictions   │    │ - Data Models   │    │ - Model Training│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────▼───────────────────────┘
                        ┌─────────────────┐
                        │   MongoDB       │
                        │                 │
                        │ - Users         │
                        │ - Doctors       │
                        │ - Predictions   │
                        └─────────────────┘
```

### Component Architecture

#### Frontend Components
- **DoctorLogin**: Authentication interface for medical professionals
- **DoctorDashboard**: Main dashboard with ML prediction capabilities
- **MLPredictionForm**: Symptom input and patient information form
- **PredictionResults**: Display AI predictions with confidence scores
- **PredictionHistory**: Historical view of doctor's ML predictions
- **AdminDoctorManagement**: Admin interface for doctor account management

#### Backend Services
- **AuthService**: JWT-based authentication and authorization
- **DoctorService**: Doctor profile and permission management
- **MLService**: Integration with ML prediction service
- **PredictionService**: Prediction history and audit logging
- **AdminService**: Administrative functions for doctor management

#### ML Service Components
- **DiseasePredictor**: Core ML model using Training.csv data
- **SymptomProcessor**: Symptom data preprocessing and validation
- **ModelManager**: Model loading, caching, and performance monitoring
- **PredictionAPI**: RESTful API for disease predictions

## Database Design

### Enhanced Doctor Model

```javascript
const doctorSchema = new mongoose.Schema({
  // Existing fields...
  
  // ML Access Control
  mlAccess: {
    type: Boolean,
    default: false,
    required: true
  },
  mlAccessGrantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mlAccessGrantedDate: Date,
  
  // ML Usage Statistics
  mlStats: {
    totalPredictions: { type: Number, default: 0 },
    lastPredictionDate: Date,
    averageConfidence: { type: Number, default: 0 },
    accuracyRating: { type: Number, default: 0 }
  }
});
```

### New Prediction History Model

```javascript
const predictionHistorySchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  patient: {
    name: String,
    age: Number,
    gender: String,
    medicalHistory: String
  },
  symptoms: [{
    symptom: String,
    value: Number // 0 or 1
  }],
  prediction: {
    predictedCondition: String,
    confidence: Number,
    topPredictions: [{
      disease: String,
      probability: Number
    }]
  },
  mlServiceStatus: {
    type: String,
    enum: ['online', 'offline', 'fallback'],
    required: true
  },
  responseTime: Number, // milliseconds
  createdAt: { type: Date, default: Date.now },
  
  // Audit fields
  sessionId: String,
  ipAddress: String,
  userAgent: String
});
```

### ML Service Status Model

```javascript
const mlServiceStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['online', 'offline', 'degraded'],
    required: true
  },
  lastChecked: { type: Date, default: Date.now },
  responseTime: Number,
  errorMessage: String,
  uptime: Number, // percentage
  totalRequests: { type: Number, default: 0 },
  successfulRequests: { type: Number, default: 0 },
  failedRequests: { type: Number, default: 0 }
});
```

## API Design

### Authentication Endpoints

#### POST /api/auth/doctor/login
```javascript
// Request
{
  "email": "doctor@hospital.com",
  "password": "securePassword123"
}

// Response
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "doctor_id",
    "name": "Dr. John Smith",
    "email": "doctor@hospital.com",
    "role": "doctor",
    "specialization": "Cardiology",
    "mlAccess": true
  }
}
```

### ML Prediction Endpoints

#### POST /api/doctor/ml/predict
```javascript
// Request
{
  "patientInfo": {
    "name": "John Doe",
    "age": 45,
    "gender": "Male",
    "medicalHistory": "Hypertension, Diabetes"
  },
  "symptoms": {
    "fever": 1,
    "cough": 1,
    "fatigue": 1,
    "headache": 0,
    // ... other symptoms
  }
}

// Response
{
  "success": true,
  "prediction": {
    "predictedCondition": "Common Cold",
    "confidence": 0.87,
    "topPredictions": [
      { "disease": "Common Cold", "probability": 0.87 },
      { "disease": "Flu", "probability": 0.12 },
      { "disease": "Bronchitis", "probability": 0.01 }
    ]
  },
  "mlServiceStatus": "online",
  "responseTime": 1250,
  "predictionId": "pred_12345"
}
```

#### GET /api/doctor/ml/history
```javascript
// Response
{
  "success": true,
  "predictions": [
    {
      "id": "pred_12345",
      "patientName": "John Doe",
      "date": "2024-01-21T10:30:00Z",
      "symptoms": ["fever", "cough", "fatigue"],
      "prediction": "Common Cold",
      "confidence": 0.87,
      "mlServiceStatus": "online"
    }
    // ... more predictions
  ],
  "totalCount": 25,
  "page": 1,
  "limit": 10
}
```

### Admin Management Endpoints

#### POST /api/admin/doctors
```javascript
// Request
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@hospital.com",
  "specialization": "Cardiology",
  "mlAccess": true,
  "medicalLicenseNumber": "MD123456"
}

// Response
{
  "success": true,
  "doctor": {
    "id": "doctor_id",
    "doctorId": "D12345678",
    "fullName": "Dr. Jane Smith",
    "email": "jane.smith@hospital.com",
    "mlAccess": true,
    "temporaryPassword": "TempPass123!"
  }
}
```

## ML Service Integration

### Enhanced Disease Predictor with Proper Training Data Usage

```python
class DiseasePredictor:
    def __init__(self):
        self.load_datasets()
        self.preprocess_data()
        self.train_models()
        self.evaluate_models()
        self.symptom_columns = self.get_symptom_columns()
        
    def load_datasets(self):
        """Load Training.csv for training and Testing.csv for validation"""
        self.training_data = pd.read_csv('../Training.csv')
        self.testing_data = pd.read_csv('../Testing.csv')
        print(f"Loaded {len(self.training_data)} training samples")
        print(f"Loaded {len(self.testing_data)} testing samples")
        
    def preprocess_data(self):
        """Preprocess and validate data quality"""
        # Separate features and labels for training data
        self.X_train = self.training_data.drop('prognosis', axis=1)
        self.y_train = self.training_data['prognosis']
        
        # Separate features and labels for testing data
        self.X_test = self.testing_data.drop('prognosis', axis=1)
        self.y_test = self.testing_data['prognosis']
        
        # Validate data consistency
        assert list(self.X_train.columns) == list(self.X_test.columns), "Feature mismatch between datasets"
        
        # Create validation split from training data
        self.X_train_split, self.X_val, self.y_train_split, self.y_val = train_test_split(
            self.X_train, self.y_train, test_size=0.2, random_state=42, stratify=self.y_train
        )
        
    def train_models(self):
        """Train multiple ML models for ensemble approach"""
        print("Training ML models...")
        
        # Random Forest (primary model)
        self.rf_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.rf_model.fit(self.X_train_split, self.y_train_split)
        
        # Support Vector Machine
        self.svm_model = SVC(
            kernel='rbf',
            probability=True,
            random_state=42,
            gamma='scale'
        )
        self.svm_model.fit(self.X_train_split, self.y_train_split)
        
        # Gradient Boosting
        self.gb_model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        self.gb_model.fit(self.X_train_split, self.y_train_split)
        
        print("Model training completed")
        
    def evaluate_models(self):
        """Evaluate models on validation and test sets"""
        from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
        
        models = {
            'Random Forest': self.rf_model,
            'SVM': self.svm_model,
            'Gradient Boosting': self.gb_model
        }
        
        self.model_performance = {}
        
        for name, model in models.items():
            # Validation set performance
            val_pred = model.predict(self.X_val)
            val_accuracy = accuracy_score(self.y_val, val_pred)
            
            # Test set performance
            test_pred = model.predict(self.X_test)
            test_accuracy = accuracy_score(self.y_test, test_pred)
            
            self.model_performance[name] = {
                'validation_accuracy': val_accuracy,
                'test_accuracy': test_accuracy,
                'classification_report': classification_report(self.y_test, test_pred, output_dict=True)
            }
            
            print(f"{name} - Validation Accuracy: {val_accuracy:.4f}, Test Accuracy: {test_accuracy:.4f}")
        
    def predict(self, symptoms_dict):
        """Make ensemble prediction with confidence scores"""
        # Convert symptoms dict to feature vector
        feature_vector = self.symptoms_to_vector(symptoms_dict)
        
        # Get predictions from all models
        rf_pred = self.rf_model.predict_proba([feature_vector])[0]
        svm_pred = self.svm_model.predict_proba([feature_vector])[0]
        gb_pred = self.gb_model.predict_proba([feature_vector])[0]
        
        # Ensemble prediction (weighted average based on validation performance)
        rf_weight = self.model_performance['Random Forest']['validation_accuracy']
        svm_weight = self.model_performance['SVM']['validation_accuracy']
        gb_weight = self.model_performance['Gradient Boosting']['validation_accuracy']
        
        total_weight = rf_weight + svm_weight + gb_weight
        ensemble_pred = (
            (rf_weight / total_weight) * rf_pred +
            (svm_weight / total_weight) * svm_pred +
            (gb_weight / total_weight) * gb_pred
        )
        
        # Get top predictions
        top_indices = np.argsort(ensemble_pred)[-5:][::-1]
        top_predictions = []
        
        for idx in top_indices:
            disease = self.rf_model.classes_[idx]
            probability = ensemble_pred[idx]
            top_predictions.append({
                'disease': disease,
                'probability': float(probability)
            })
        
        return {
            'predicted_condition': top_predictions[0]['disease'],
            'confidence': float(top_predictions[0]['probability']),
            'top_predictions': top_predictions,
            'model_performance': self.get_model_summary()
        }
    
    def get_model_summary(self):
        """Return model performance summary"""
        return {
            'training_samples': len(self.training_data),
            'testing_samples': len(self.testing_data),
            'num_features': len(self.X_train.columns),
            'num_diseases': len(self.y_train.unique()),
            'best_model_accuracy': max([
                perf['test_accuracy'] for perf in self.model_performance.values()
            ])
        }
```

### Model Training Pipeline

```python
class ModelTrainingPipeline:
    def __init__(self):
        self.predictor = DiseasePredictor()
        self.model_version = self.generate_version()
        
    def train_and_evaluate(self):
        """Complete training and evaluation pipeline"""
        print("Starting ML model training pipeline...")
        
        # Load and preprocess data
        self.predictor.load_datasets()
        self.predictor.preprocess_data()
        
        # Train models
        self.predictor.train_models()
        
        # Evaluate models
        self.predictor.evaluate_models()
        
        # Save models
        self.save_models()
        
        # Generate training report
        self.generate_training_report()
        
        print("Training pipeline completed successfully")
        
    def save_models(self):
        """Save trained models with versioning"""
        import joblib
        import os
        
        model_dir = f'models/v{self.model_version}'
        os.makedirs(model_dir, exist_ok=True)
        
        # Save individual models
        joblib.dump(self.predictor.rf_model, f'{model_dir}/random_forest.pkl')
        joblib.dump(self.predictor.svm_model, f'{model_dir}/svm.pkl')
        joblib.dump(self.predictor.gb_model, f'{model_dir}/gradient_boosting.pkl')
        
        # Save metadata
        metadata = {
            'version': self.model_version,
            'training_date': datetime.now().isoformat(),
            'training_samples': len(self.predictor.training_data),
            'testing_samples': len(self.predictor.testing_data),
            'features': list(self.predictor.X_train.columns),
            'diseases': list(self.predictor.y_train.unique()),
            'performance': self.predictor.model_performance
        }
        
        with open(f'{model_dir}/metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
            
    def generate_training_report(self):
        """Generate comprehensive training report"""
        report = {
            'model_version': self.model_version,
            'training_date': datetime.now().isoformat(),
            'dataset_info': {
                'training_samples': len(self.predictor.training_data),
                'testing_samples': len(self.predictor.testing_data),
                'num_features': len(self.predictor.X_train.columns),
                'num_diseases': len(self.predictor.y_train.unique())
            },
            'model_performance': self.predictor.model_performance,
            'recommendations': self.generate_recommendations()
        }
        
        with open(f'models/v{self.model_version}/training_report.json', 'w') as f:
            json.dump(report, f, indent=2)
            
    def generate_recommendations(self):
        """Generate recommendations based on model performance"""
        recommendations = []
        
        best_model = max(
            self.predictor.model_performance.items(),
            key=lambda x: x[1]['test_accuracy']
        )
        
        if best_model[1]['test_accuracy'] < 0.85:
            recommendations.append("Consider feature engineering or additional data collection")
        
        if best_model[1]['test_accuracy'] > 0.95:
            recommendations.append("Excellent performance - ready for production deployment")
            
        return recommendations
```