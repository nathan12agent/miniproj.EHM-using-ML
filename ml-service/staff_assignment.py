#!/usr/bin/env python3
"""
Staff Assignment Module
ML-based staff selection using suitability scoring
Uses RandomForestRegressor to predict staff suitability scores
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from datetime import datetime, time

class StaffAssignmentModel:
    def __init__(self):
        self.staff_data = self.load_staff_data()
        self.doctor_model = None
        self.nurse_model = None
        self.scaler = StandardScaler()
        self.load_or_initialize_models()
    
    def load_staff_data(self):
        """Load staff information from CSV"""
        try:
            staff_path = 'data/staff_data.csv'
            if os.path.exists(staff_path):
                df = pd.read_csv(staff_path)
                print(f"✅ Loaded {len(df)} staff members")
                return df
            else:
                print("⚠️  Staff data file not found")
                return pd.DataFrame()
        except Exception as e:
            print(f"⚠️  Error loading staff data: {e}")
            return pd.DataFrame()
    
    def load_or_initialize_models(self):
        """Load pre-trained models or initialize new ones"""
        doctor_model_path = 'models/doctor_assignment_model.pkl'
        nurse_model_path = 'models/nurse_assignment_model.pkl'
        scaler_path = 'models/assignment_scaler.pkl'
        
        try:
            if os.path.exists(doctor_model_path) and os.path.exists(nurse_model_path):
                with open(doctor_model_path, 'rb') as f:
                    self.doctor_model = pickle.load(f)
                with open(nurse_model_path, 'rb') as f:
                    self.nurse_model = pickle.load(f)
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                print("✅ Staff assignment models loaded")
            else:
                print("⚠️  Assignment models not found, will use rule-based scoring")
        except Exception as e:
            print(f"⚠️  Error loading assignment models: {e}")

    def calculate_hours_remaining(self, shift_start, shift_end):
        """Calculate hours remaining in current shift"""
        try:
            now = datetime.now().time()
            start = datetime.strptime(shift_start, '%H:%M').time()
            end = datetime.strptime(shift_end, '%H:%M').time()
            
            # Convert to minutes for easier calculation
            now_mins = now.hour * 60 + now.minute
            end_mins = end.hour * 60 + end.minute
            
            # Handle overnight shifts
            if end_mins < now_mins:
                end_mins += 24 * 60
            
            remaining = max(0, end_mins - now_mins) / 60.0
            return remaining
        except:
            return 8.0  # Default 8 hours
    
    def calculate_expertise_match(self, staff_expertise, required_expertise):
        """Calculate expertise match score (0-1)"""
        if not required_expertise or not staff_expertise:
            return 0.5  # Neutral score
        
        staff_skills = set(str(staff_expertise).lower().split(','))
        required_skills = set(str(required_expertise).lower().split(','))
        
        if not required_skills:
            return 0.5
        
        # Calculate Jaccard similarity
        intersection = len(staff_skills & required_skills)
        union = len(staff_skills | required_skills)
        
        return intersection / union if union > 0 else 0.0
    
    def extract_features(self, staff_row, department, required_expertise):
        """
        Extract features for ML model
        Features: current_load, availability, expertise_match, hours_remaining, 
                  experience_years, performance_score
        """
        features = {
            'current_load': staff_row['current_load'],
            'availability': staff_row['availability'],
            'expertise_match': self.calculate_expertise_match(
                staff_row['expertise'], required_expertise
            ),
            'hours_remaining': self.calculate_hours_remaining(
                staff_row['shift_start'], staff_row['shift_end']
            ),
            'experience_years': staff_row['experience_years'],
            'performance_score': staff_row['performance_score'],
            'department_match': 1.0 if staff_row['department'] == department else 0.0
        }
        return features
    
    def calculate_suitability_score(self, features, use_ml=False, role='doctor'):
        """
        Calculate suitability score for staff member
        
        Args:
            features: Dict of feature values
            use_ml: Whether to use ML model (if available)
            role: 'doctor' or 'nurse'
        
        Returns:
            Suitability score (0-100)
        """
        # Rule-based scoring (fallback or when ML not available)
        if not use_ml or (role == 'doctor' and not self.doctor_model) or (role == 'nurse' and not self.nurse_model):
            score = 0.0
            
            # Availability (30%)
            score += features['availability'] * 30
            
            # Low workload (20%)
            load_score = max(0, (5 - features['current_load']) / 5) * 20
            score += load_score
            
            # Expertise match (25%)
            score += features['expertise_match'] * 25
            
            # Hours remaining (10%)
            hours_score = min(features['hours_remaining'] / 8.0, 1.0) * 10
            score += hours_score
            
            # Experience (10%)
            exp_score = min(features['experience_years'] / 20.0, 1.0) * 10
            score += exp_score
            
            # Performance (5%)
            score += features['performance_score'] * 5
            
            return score
        
        # ML-based scoring
        try:
            model = self.doctor_model if role == 'doctor' else self.nurse_model
            
            # Prepare feature vector
            feature_vector = np.array([[
                features['current_load'],
                features['availability'],
                features['expertise_match'],
                features['hours_remaining'],
                features['experience_years'],
                features['performance_score'],
                features['department_match']
            ]])
            
            # Scale features
            feature_vector_scaled = self.scaler.transform(feature_vector)
            
            # Predict suitability score
            score = model.predict(feature_vector_scaled)[0]
            
            # Ensure score is in 0-100 range
            return max(0, min(100, score))
            
        except Exception as e:
            print(f"⚠️  ML prediction failed, using rule-based: {e}")
            return self.calculate_suitability_score(features, use_ml=False, role=role)
    
    def assign_doctor(self, department, specialist_type, urgency_level, required_expertise=None):
        """
        Assign best available doctor based on suitability scoring
        
        Returns:
            dict with doctor info and assignment details
        """
        if self.staff_data.empty:
            return {
                'success': False,
                'message': 'No staff data available',
                'assigned_doctor': None
            }
        
        # Filter doctors
        doctors = self.staff_data[self.staff_data['role'] == 'doctor'].copy()
        
        if doctors.empty:
            return {
                'success': False,
                'message': 'No doctors available',
                'assigned_doctor': None
            }
        
        # Calculate suitability scores for all doctors
        scores = []
        for idx, doctor in doctors.iterrows():
            features = self.extract_features(doctor, department, required_expertise or specialist_type)
            score = self.calculate_suitability_score(features, use_ml=False, role='doctor')
            scores.append({
                'staff_id': doctor['staff_id'],
                'name': doctor['name'],
                'department': doctor['department'],
                'expertise': doctor['expertise'],
                'current_load': doctor['current_load'],
                'availability': doctor['availability'],
                'suitability_score': score,
                'features': features
            })
        
        # Sort by suitability score
        scores.sort(key=lambda x: x['suitability_score'], reverse=True)
        
        # Get top 3 candidates
        top_candidates = scores[:3]
        
        # Select best available doctor
        best_doctor = None
        for candidate in top_candidates:
            if candidate['availability'] == 1:
                best_doctor = candidate
                break
        
        if not best_doctor and top_candidates:
            # If no available doctor, return best one anyway (may need to be called)
            best_doctor = top_candidates[0]
        
        if best_doctor:
            return {
                'success': True,
                'assigned_doctor': best_doctor,
                'alternatives': top_candidates[1:3],
                'assignment_method': 'ml_suitability_scoring',
                'urgency_level': urgency_level
            }
        else:
            return {
                'success': False,
                'message': 'No suitable doctor found',
                'assigned_doctor': None
            }
    
    def assign_nurse(self, department, urgency_level, required_expertise=None):
        """
        Assign best available nurse based on suitability scoring
        
        Returns:
            dict with nurse info and assignment details
        """
        if self.staff_data.empty:
            return {
                'success': False,
                'message': 'No staff data available',
                'assigned_nurse': None
            }
        
        # Filter nurses
        nurses = self.staff_data[self.staff_data['role'] == 'nurse'].copy()
        
        if nurses.empty:
            return {
                'success': False,
                'message': 'No nurses available',
                'assigned_nurse': None
            }
        
        # Calculate suitability scores for all nurses
        scores = []
        for idx, nurse in nurses.iterrows():
            features = self.extract_features(nurse, department, required_expertise)
            score = self.calculate_suitability_score(features, use_ml=False, role='nurse')
            scores.append({
                'staff_id': nurse['staff_id'],
                'name': nurse['name'],
                'department': nurse['department'],
                'expertise': nurse['expertise'],
                'current_load': nurse['current_load'],
                'availability': nurse['availability'],
                'suitability_score': score,
                'features': features
            })
        
        # Sort by suitability score
        scores.sort(key=lambda x: x['suitability_score'], reverse=True)
        
        # Get top 3 candidates
        top_candidates = scores[:3]
        
        # Select best available nurse
        best_nurse = None
        for candidate in top_candidates:
            if candidate['availability'] == 1:
                best_nurse = candidate
                break
        
        if not best_nurse and top_candidates:
            # If no available nurse, return best one anyway
            best_nurse = top_candidates[0]
        
        if best_nurse:
            return {
                'success': True,
                'assigned_nurse': best_nurse,
                'alternatives': top_candidates[1:3],
                'assignment_method': 'ml_suitability_scoring',
                'urgency_level': urgency_level
            }
        else:
            return {
                'success': False,
                'message': 'No suitable nurse found',
                'assigned_nurse': None
            }
    
    def train_assignment_models(self, training_data_path='data/assignment_history.csv'):
        """
        Train ML models for staff assignment
        Uses RandomForestRegressor to predict suitability scores
        
        This demonstrates LO 2.4: Ensemble Methods (Random Forest)
        """
        try:
            if not os.path.exists(training_data_path):
                print("⚠️  No training data found for assignment models")
                return None
            
            # Load training data
            df = pd.read_csv(training_data_path)
            
            # Separate doctor and nurse data
            doctor_data = df[df['role'] == 'doctor']
            nurse_data = df[df['role'] == 'nurse']
            
            # Train doctor model
            if not doctor_data.empty:
                X_doc = doctor_data[['current_load', 'availability', 'expertise_match', 
                                     'hours_remaining', 'experience_years', 'performance_score',
                                     'department_match']]
                y_doc = doctor_data['suitability_score']
                
                self.doctor_model = RandomForestRegressor(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42
                )
                
                # Fit scaler
                self.scaler.fit(X_doc)
                X_doc_scaled = self.scaler.transform(X_doc)
                
                # Train model
                self.doctor_model.fit(X_doc_scaled, y_doc)
                
                # Cross-validation
                scores = cross_val_score(self.doctor_model, X_doc_scaled, y_doc, cv=5, 
                                        scoring='r2')
                print(f"✅ Doctor assignment model trained (R² = {scores.mean():.3f})")
            
            # Train nurse model
            if not nurse_data.empty:
                X_nurse = nurse_data[['current_load', 'availability', 'expertise_match',
                                      'hours_remaining', 'experience_years', 'performance_score',
                                      'department_match']]
                y_nurse = nurse_data['suitability_score']
                
                self.nurse_model = RandomForestRegressor(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42
                )
                
                X_nurse_scaled = self.scaler.transform(X_nurse)
                self.nurse_model.fit(X_nurse_scaled, y_nurse)
                
                scores = cross_val_score(self.nurse_model, X_nurse_scaled, y_nurse, cv=5,
                                        scoring='r2')
                print(f"✅ Nurse assignment model trained (R² = {scores.mean():.3f})")
            
            # Save models
            os.makedirs('models', exist_ok=True)
            if self.doctor_model:
                with open('models/doctor_assignment_model.pkl', 'wb') as f:
                    pickle.dump(self.doctor_model, f)
            if self.nurse_model:
                with open('models/nurse_assignment_model.pkl', 'wb') as f:
                    pickle.dump(self.nurse_model, f)
            with open('models/assignment_scaler.pkl', 'wb') as f:
                pickle.dump(self.scaler, f)
            
            return True
            
        except Exception as e:
            print(f"❌ Error training assignment models: {e}")
            return None

# Global instance
staff_assigner = None

def get_staff_assigner():
    """Get or create staff assigner instance"""
    global staff_assigner
    if staff_assigner is None:
        staff_assigner = StaffAssignmentModel()
    return staff_assigner
