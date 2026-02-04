import pandas as pd
import numpy as np
import joblib
import os
import json
from datetime import datetime

class DiseasePredictor:
    def __init__(self, training_csv_path=None, testing_csv_path=None):
        self.models = {}
        self.selected_features = None
        self.scaler = None
        self.symptom_columns = []
        self.model_performance = {}
        self.metadata = {}
        
        # Load enhanced models
        self.load_enhanced_models()
    
    def load_enhanced_models(self):
        """Load the enhanced models and preprocessing objects"""
        model_dir = 'models'
        
        try:
            print("Loading enhanced models...")
            
            # Load models
            model_files = {
                'random_forest': os.path.join(model_dir, 'random_forest.pkl'),
                'svm': os.path.join(model_dir, 'svm.pkl'),
                'gradient_boosting': os.path.join(model_dir, 'gradient_boosting.pkl'),
                'extra_trees': os.path.join(model_dir, 'extra_trees.pkl'),
                'enhanced_ensemble': os.path.join(model_dir, 'enhanced_ensemble.pkl')
            }
            
            for name, path in model_files.items():
                if os.path.exists(path):
                    self.models[name] = joblib.load(path)
            
            # Load preprocessing objects
            if os.path.exists(os.path.join(model_dir, 'selected_features.pkl')):
                self.selected_features = joblib.load(os.path.join(model_dir, 'selected_features.pkl'))
            
            if os.path.exists(os.path.join(model_dir, 'scaler.pkl')):
                self.scaler = joblib.load(os.path.join(model_dir, 'scaler.pkl'))
            
            if os.path.exists(os.path.join(model_dir, 'symptom_columns.pkl')):
                self.symptom_columns = joblib.load(os.path.join(model_dir, 'symptom_columns.pkl'))
            
            # Load metadata
            metadata_file = os.path.join(model_dir, 'metadata.json')
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r') as f:
                    self.metadata = json.load(f)
                    self.model_performance = self.metadata.get('performance', {})
            
            print(f"Enhanced models loaded successfully!")
            print(f"Model version: {self.metadata.get('version', 'unknown')}")
            print(f"Available models: {list(self.models.keys())}")
            print(f"Best model: {self.metadata.get('best_model', 'unknown')}")
            print(f"Selected features: {len(self.selected_features) if self.selected_features is not None else 'N/A'}")
            
        except Exception as e:
            print(f"Error loading enhanced models: {e}")
            # Fallback to basic model loading if enhanced models fail
            self.load_basic_models()
    
    def load_basic_models(self):
        """Fallback to load basic models if enhanced models are not available"""
        print("Loading basic models as fallback...")
        
        # Try to load Training.csv for basic training
        training_paths = [
            '../Training.csv',
            'Training.csv',
            os.path.join(os.path.dirname(__file__), '..', 'Training.csv')
        ]
        
        training_data = None
        for path in training_paths:
            if os.path.exists(path):
                training_data = pd.read_csv(path)
                break
        
        if training_data is None:
            raise FileNotFoundError("No training data found")
        
        # Basic preprocessing
        X = training_data.drop('prognosis', axis=1)
        y = training_data['prognosis']
        
        X = X.fillna(0).astype(int)
        self.symptom_columns = list(X.columns)
        
        # Train basic Random Forest
        from sklearn.ensemble import RandomForestClassifier
        self.models['random_forest'] = RandomForestClassifier(
            n_estimators=100, random_state=42, n_jobs=-1
        )
        self.models['random_forest'].fit(X, y)
        
        print("Basic Random Forest model trained as fallback")
    
    def predict(self, symptoms_dict):
        """Make enhanced prediction with the best available model"""
        try:
            # Create feature vector
            feature_vector = np.zeros(len(self.symptom_columns))
            
            for symptom, value in symptoms_dict.items():
                symptom_clean = symptom.lower().replace(' ', '_')
                if symptom_clean in self.symptom_columns:
                    idx = self.symptom_columns.index(symptom_clean)
                    feature_vector[idx] = value
            
            # Apply feature selection if available
            if self.selected_features is not None:
                feature_vector_selected = feature_vector[self.selected_features]
                print(f"Using {len(self.selected_features)} selected features")
            else:
                feature_vector_selected = feature_vector
                print(f"Using ALL {len(feature_vector)} symptoms (no feature selection)")
            
            # Get best model
            best_model_name = self.metadata.get('best_model', 'random_forest')
            if best_model_name not in self.models:
                best_model_name = list(self.models.keys())[0]
            
            model = self.models[best_model_name]
            
            # Apply scaling if needed (for SVM)
            if best_model_name == 'svm' and self.scaler is not None:
                feature_vector_final = self.scaler.transform([feature_vector_selected])
            else:
                feature_vector_final = [feature_vector_selected]
            
            # Make prediction
            prediction = model.predict(feature_vector_final)[0]
            probabilities = model.predict_proba(feature_vector_final)[0]
            
            # Get top predictions
            classes = model.classes_
            top_indices = np.argsort(probabilities)[-5:][::-1]
            top_predictions = []
            
            for idx in top_indices:
                disease = classes[idx]
                probability = probabilities[idx]
                top_predictions.append({
                    'disease': disease,
                    'probability': float(probability)
                })
            
            # Get individual model predictions if available
            individual_predictions = {}
            for name, model in self.models.items():
                try:
                    if name == 'svm' and self.scaler is not None:
                        pred_input = self.scaler.transform([feature_vector_selected])
                    else:
                        pred_input = [feature_vector_selected]
                    
                    individual_predictions[name] = model.predict(pred_input)[0]
                except:
                    continue
            
            return {
                'predicted_condition': prediction,
                'confidence': float(top_predictions[0]['probability']),
                'all_probabilities': {classes[i]: float(probabilities[i]) for i in range(len(classes))},
                'top_predictions': top_predictions,
                'individual_predictions': individual_predictions,
                'model_performance': self.get_model_summary(),
                'primary_model': best_model_name,
                'enhanced_features': self.selected_features is not None
            }
            
        except Exception as e:
            print(f"Error in prediction: {e}")
            # Return basic prediction
            return {
                'predicted_condition': 'Unknown',
                'confidence': 0.0,
                'error': str(e)
            }
    
    def get_model_summary(self):
        """Return model performance summary"""
        return {
            'models_available': list(self.models.keys()),
            'best_model': self.metadata.get('best_model', 'unknown'),
            'model_version': self.metadata.get('version', 'unknown'),
            'training_date': self.metadata.get('training_date', 'unknown'),
            'selected_features': len(self.selected_features) if self.selected_features is not None else len(self.symptom_columns),
            'total_features': len(self.symptom_columns),
            'enhanced': self.selected_features is not None,
            'performance': self.model_performance
        }
    
    def get_all_symptoms(self):
        """Return list of all possible symptoms"""
        return self.symptom_columns