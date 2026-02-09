#!/usr/bin/env python3
"""
Patient Routing Module
Routes patients to appropriate departments based on predicted disease
Uses rule-based mapping + optional ML classifier for ambiguous cases
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder

class PatientRouter:
    def __init__(self):
        self.disease_mapping = self.load_disease_mapping()
        self.ml_router = None
        self.label_encoder = None
        self.load_or_train_ml_router()
    
    def load_disease_mapping(self):
        """Load disease to department mapping"""
        try:
            mapping_path = 'data/disease_department_mapping.csv'
            if os.path.exists(mapping_path):
                df = pd.read_csv(mapping_path)
                # Create dictionary: disease -> (department, specialist_type, urgency)
                mapping = {}
                for _, row in df.iterrows():
                    mapping[row['disease']] = {
                        'department': row['department'],
                        'specialist_type': row['specialist_type'],
                        'urgency_level': row['urgency_level']
                    }
                print(f"✅ Loaded {len(mapping)} disease-department mappings")
                return mapping
            else:
                print("⚠️  Disease mapping file not found, using default mappings")
                return self.get_default_mapping()
        except Exception as e:
            print(f"⚠️  Error loading disease mapping: {e}")
            return self.get_default_mapping()
    
    def get_default_mapping(self):
        """Default disease to department mapping"""
        return {
            'Heart Disease': {'department': 'Cardiology', 'specialist_type': 'Cardiologist', 'urgency_level': 'high'},
            'Hypertension': {'department': 'Cardiology', 'specialist_type': 'Cardiologist', 'urgency_level': 'medium'},
            'Migraine': {'department': 'Neurology', 'specialist_type': 'Neurologist', 'urgency_level': 'medium'},
            'Stroke': {'department': 'Neurology', 'specialist_type': 'Neurologist', 'urgency_level': 'critical'},
            'Flu': {'department': 'General Medicine', 'specialist_type': 'General Physician', 'urgency_level': 'low'},
            'Fever': {'department': 'General Medicine', 'specialist_type': 'General Physician', 'urgency_level': 'low'},
            'Diabetes': {'department': 'General Medicine', 'specialist_type': 'Endocrinologist', 'urgency_level': 'medium'},
            'Fracture': {'department': 'Orthopedics', 'specialist_type': 'Orthopedic Surgeon', 'urgency_level': 'high'},
            'Pneumonia': {'department': 'General Medicine', 'specialist_type': 'Pulmonologist', 'urgency_level': 'high'},
        }
    
    def load_or_train_ml_router(self):
        """Load or train ML-based router for ambiguous cases"""
        model_path = 'models/routing_model.pkl'
        encoder_path = 'models/routing_label_encoder.pkl'
        
        try:
            if os.path.exists(model_path) and os.path.exists(encoder_path):
                with open(model_path, 'rb') as f:
                    self.ml_router = pickle.load(f)
                with open(encoder_path, 'rb') as f:
                    self.label_encoder = pickle.load(f)
                print("✅ ML routing model loaded")
            else:
                print("⚠️  ML routing model not found, will use rule-based routing only")
        except Exception as e:
            print(f"⚠️  Error loading ML router: {e}")
    
    def route_patient(self, disease, confidence, top_predictions=None):
        """
        Route patient to appropriate department
        
        Args:
            disease: Predicted disease name
            confidence: Prediction confidence (0-1)
            top_predictions: List of (disease, probability) tuples for top predictions
        
        Returns:
            dict with department, specialist_type, urgency_level, routing_method
        """
        # Case 1: High confidence, direct mapping
        if confidence >= 0.75 and disease in self.disease_mapping:
            routing = self.disease_mapping[disease].copy()
            routing['routing_method'] = 'rule_based_high_confidence'
            routing['confidence'] = confidence
            return routing
        
        # Case 2: Low confidence or ambiguous - check top predictions
        if top_predictions and len(top_predictions) > 1:
            # Check if multiple diseases point to same department
            departments = []
            for pred_disease, prob in top_predictions[:3]:  # Top 3
                if pred_disease in self.disease_mapping:
                    departments.append(self.disease_mapping[pred_disease]['department'])
            
            # If majority agree on department, use that
            if departments:
                from collections import Counter
                dept_counts = Counter(departments)
                most_common_dept = dept_counts.most_common(1)[0]
                if most_common_dept[1] >= 2:  # At least 2 agree
                    # Find the mapping for this department
                    for pred_disease, prob in top_predictions:
                        if pred_disease in self.disease_mapping:
                            if self.disease_mapping[pred_disease]['department'] == most_common_dept[0]:
                                routing = self.disease_mapping[pred_disease].copy()
                                routing['routing_method'] = 'consensus_based'
                                routing['confidence'] = confidence
                                return routing
        
        # Case 3: Fallback to rule-based if disease is known
        if disease in self.disease_mapping:
            routing = self.disease_mapping[disease].copy()
            routing['routing_method'] = 'rule_based_low_confidence'
            routing['confidence'] = confidence
            routing['requires_triage'] = True
            return routing
        
        # Case 4: Unknown disease or very low confidence → Triage
        return {
            'department': 'Triage',
            'specialist_type': 'General Physician',
            'urgency_level': 'medium',
            'routing_method': 'triage_required',
            'confidence': confidence,
            'requires_triage': True,
            'message': 'Low confidence or unknown disease - manual review required'
        }
    
    def train_ml_router(self, training_data_path='data/assignment_history.csv'):
        """
        Train ML classifier for department routing
        Compares multiple algorithms: Logistic Regression, Decision Tree, SVM, Random Forest
        
        This demonstrates LO 2.2: Supervised Classification with model comparison
        """
        try:
            if not os.path.exists(training_data_path):
                print("⚠️  No training data found for ML router")
                return None
            
            # Load training data
            df = pd.read_csv(training_data_path)
            
            # Features: symptom patterns (simplified)
            # In real scenario, use actual symptom vectors
            X = df.drop(['department', 'disease'], axis=1)
            y = df['department']
            
            # Encode labels
            self.label_encoder = LabelEncoder()
            y_encoded = self.label_encoder.fit_transform(y)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y_encoded, test_size=0.2, random_state=42
            )
            
            # Compare multiple classifiers (LO 2.2)
            classifiers = {
                'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
                'Decision Tree': DecisionTreeClassifier(max_depth=10, random_state=42),
                'SVM': SVC(kernel='rbf', probability=True, random_state=42),
                'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42)
            }
            
            print("\n📊 Training and comparing routing classifiers...")
            best_score = 0
            best_model = None
            best_name = None
            
            for name, clf in classifiers.items():
                # Cross-validation
                scores = cross_val_score(clf, X_train, y_train, cv=5)
                mean_score = scores.mean()
                print(f"   {name}: {mean_score:.3f} accuracy (CV)")
                
                if mean_score > best_score:
                    best_score = mean_score
                    best_model = clf
                    best_name = name
            
            # Train best model on full training set
            best_model.fit(X_train, y_train)
            test_score = best_model.score(X_test, y_test)
            
            print(f"\n✅ Best model: {best_name} (Test accuracy: {test_score:.3f})")
            
            # Save model
            self.ml_router = best_model
            os.makedirs('models', exist_ok=True)
            with open('models/routing_model.pkl', 'wb') as f:
                pickle.dump(best_model, f)
            with open('models/routing_label_encoder.pkl', 'wb') as f:
                pickle.dump(self.label_encoder, f)
            
            return best_model
            
        except Exception as e:
            print(f"❌ Error training ML router: {e}")
            return None
    
    def get_routing_info(self):
        """Get information about routing system"""
        return {
            'total_mappings': len(self.disease_mapping),
            'departments': list(set(m['department'] for m in self.disease_mapping.values())),
            'ml_router_available': self.ml_router is not None,
            'routing_methods': ['rule_based_high_confidence', 'consensus_based', 'rule_based_low_confidence', 'triage_required']
        }

# Global instance
patient_router = None

def get_patient_router():
    """Get or create patient router instance"""
    global patient_router
    if patient_router is None:
        patient_router = PatientRouter()
    return patient_router
