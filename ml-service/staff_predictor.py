#!/usr/bin/env python3
"""
Staff Management ML Predictor
Provides predictions for absenteeism, staffing needs, clustering, and burnout
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import pickle
import json

# Scikit-learn imports
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error

class StaffPredictor:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.cluster_labels = {
            0: "Senior Specialists",
            1: "Junior Generalists", 
            2: "Night Shift Experts",
            3: "Part-Time Staff",
            4: "High Performers"
        }
        self.load_or_train_models()
    
    def load_or_train_models(self):
        """Load existing models or train new ones"""
        model_dir = 'models/staff'
        os.makedirs(model_dir, exist_ok=True)
        
        # Try to load existing models
        try:
            with open(f'{model_dir}/absenteeism_model.pkl', 'rb') as f:
                self.models['absenteeism'] = pickle.load(f)
            with open(f'{model_dir}/staffing_model.pkl', 'rb') as f:
                self.models['staffing'] = pickle.load(f)
            with open(f'{model_dir}/clustering_model.pkl', 'rb') as f:
                self.models['clustering'] = pickle.load(f)
            with open(f'{model_dir}/burnout_model.pkl', 'rb') as f:
                self.models['burnout'] = pickle.load(f)
            with open(f'{model_dir}/scalers.pkl', 'rb') as f:
                self.scalers = pickle.load(f)
            
            print("✅ Staff ML models loaded successfully")
        except FileNotFoundError:
            print("⚠️  Models not found. Training new models with synthetic data...")
            self.train_models_with_synthetic_data()
    
    def generate_synthetic_training_data(self):
        """Generate synthetic data for model training"""
        np.random.seed(42)
        n_samples = 1000
        
        # Absenteeism training data
        absenteeism_data = {
            'absence_last_7_days': np.random.poisson(0.5, n_samples),
            'absence_last_30_days': np.random.poisson(2, n_samples),
            'shift_type': np.random.choice([0, 1, 2], n_samples),  # Day, Night, Rotating
            'distance_km': np.random.uniform(1, 50, n_samples),
            'experience_years': np.random.uniform(0, 20, n_samples),
            'department_workload': np.random.uniform(5, 30, n_samples),
            'day_of_week': np.random.randint(0, 7, n_samples),
            'is_weekend': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),
            'is_holiday': np.random.choice([0, 1], n_samples, p=[0.9, 0.1]),
            'season': np.random.randint(0, 4, n_samples),
            'consecutive_shifts': np.random.randint(0, 10, n_samples)
        }
        
        # Generate target: higher absence probability for certain conditions
        absence_prob = (
            0.05 * absenteeism_data['absence_last_30_days'] +
            0.02 * absenteeism_data['distance_km'] +
            0.03 * absenteeism_data['consecutive_shifts'] +
            0.1 * absenteeism_data['is_weekend'] +
            np.random.normal(0, 0.1, n_samples)
        )
        absenteeism_data['will_be_absent'] = (absence_prob > 0.3).astype(int)
        
        df_absenteeism = pd.DataFrame(absenteeism_data)
        
        # Staffing needs training data
        staffing_data = {
            'day_of_week': np.random.randint(0, 7, n_samples),
            'month': np.random.randint(1, 13, n_samples),
            'is_weekend': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),
            'is_holiday': np.random.choice([0, 1], n_samples, p=[0.9, 0.1]),
            'season': np.random.randint(0, 4, n_samples),
            'admissions_last_7_days': np.random.poisson(50, n_samples),
            'admissions_last_30_days': np.random.poisson(200, n_samples),
            'department_type': np.random.randint(0, 5, n_samples)
        }
        
        # Generate target: staff needed based on admissions
        staffing_data['staff_needed'] = (
            10 + 
            0.1 * staffing_data['admissions_last_7_days'] +
            0.5 * staffing_data['is_weekend'] +
            np.random.normal(0, 2, n_samples)
        ).astype(int)
        
        df_staffing = pd.DataFrame(staffing_data)
        
        return df_absenteeism, df_staffing

    def train_models_with_synthetic_data(self):
        """Train all ML models using synthetic data"""
        print("🔄 Generating synthetic training data...")
        df_absenteeism, df_staffing = self.generate_synthetic_training_data()
        
        # 1. Train Absenteeism Models (Compare 4 algorithms)
        print("\n📊 Training Absenteeism Prediction Models...")
        X_abs = df_absenteeism.drop('will_be_absent', axis=1)
        y_abs = df_absenteeism['will_be_absent']
        
        X_abs_train, X_abs_test, y_abs_train, y_abs_test = train_test_split(
            X_abs, y_abs, test_size=0.2, random_state=42
        )
        
        # Scale features
        scaler_abs = StandardScaler()
        X_abs_train_scaled = scaler_abs.fit_transform(X_abs_train)
        X_abs_test_scaled = scaler_abs.transform(X_abs_test)
        
        # Train and compare models
        absenteeism_models = {
            'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
            'Decision Tree': DecisionTreeClassifier(max_depth=5, random_state=42),
            'SVM': SVC(probability=True, kernel='rbf', random_state=42),
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42)
        }
        
        best_score = 0
        best_model_name = None
        
        for name, model in absenteeism_models.items():
            model.fit(X_abs_train_scaled, y_abs_train)
            score = model.score(X_abs_test_scaled, y_abs_test)
            print(f"   {name}: {score:.3f} accuracy")
            
            if score > best_score:
                best_score = score
                best_model_name = name
                self.models['absenteeism'] = model
        
        print(f"✅ Best model: {best_model_name} ({best_score:.3f})")
        self.scalers['absenteeism'] = scaler_abs
        
        # 2. Train Staffing Needs Model (Regression)
        print("\n📊 Training Staffing Needs Prediction Model...")
        X_staff = df_staffing.drop('staff_needed', axis=1)
        y_staff = df_staffing['staff_needed']
        
        X_staff_train, X_staff_test, y_staff_train, y_staff_test = train_test_split(
            X_staff, y_staff, test_size=0.2, random_state=42
        )
        
        scaler_staff = StandardScaler()
        X_staff_train_scaled = scaler_staff.fit_transform(X_staff_train)
        X_staff_test_scaled = scaler_staff.transform(X_staff_test)
        
        staffing_model = RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42)
        staffing_model.fit(X_staff_train_scaled, y_staff_train)
        
        y_pred = staffing_model.predict(X_staff_test_scaled)
        mae = mean_absolute_error(y_staff_test, y_pred)
        print(f"✅ Random Forest Regressor trained (MAE: {mae:.2f})")
        
        self.models['staffing'] = staffing_model
        self.scalers['staffing'] = scaler_staff
        
        # 3. Train Clustering Model
        print("\n📊 Training Staff Clustering Model...")
        # Generate clustering data
        n_staff = 200
        clustering_data = {
            'experience_years': np.random.uniform(0, 20, n_staff),
            'performance_rating': np.random.uniform(1, 5, n_staff),
            'shift_preference': np.random.randint(0, 3, n_staff),
            'specialization_count': np.random.randint(1, 5, n_staff),
            'avg_hours_per_week': np.random.uniform(20, 60, n_staff),
            'night_shift_frequency': np.random.uniform(0, 1, n_staff)
        }
        
        df_cluster = pd.DataFrame(clustering_data)
        scaler_cluster = StandardScaler()
        X_cluster_scaled = scaler_cluster.fit_transform(df_cluster)
        
        kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
        kmeans.fit(X_cluster_scaled)
        print(f"✅ K-Means clustering trained (k=5)")
        
        self.models['clustering'] = kmeans
        self.scalers['clustering'] = scaler_cluster
        
        # 4. Train Burnout Risk Model
        print("\n📊 Training Burnout Risk Prediction Model...")
        n_burnout = 1000
        burnout_data = {
            'consecutive_shifts': np.random.randint(0, 15, n_burnout),
            'avg_hours_per_week': np.random.uniform(20, 70, n_burnout),
            'night_shifts_last_month': np.random.randint(0, 20, n_burnout),
            'avg_patient_load': np.random.uniform(5, 30, n_burnout),
            'days_since_last_leave': np.random.randint(0, 365, n_burnout),
            'years_in_current_role': np.random.uniform(0, 20, n_burnout),
            'overtime_hours': np.random.uniform(0, 40, n_burnout)
        }
        
        # Generate target: burnout risk based on workload
        burnout_score = (
            0.1 * burnout_data['consecutive_shifts'] +
            0.05 * burnout_data['avg_hours_per_week'] +
            0.08 * burnout_data['night_shifts_last_month'] +
            0.02 * burnout_data['days_since_last_leave'] +
            np.random.normal(0, 1, n_burnout)
        )
        
        burnout_data['burnout_risk'] = pd.cut(
            burnout_score, 
            bins=[-np.inf, 5, 10, np.inf], 
            labels=[0, 1, 2]  # Low, Medium, High
        ).astype(int)
        
        df_burnout = pd.DataFrame(burnout_data)
        X_burn = df_burnout.drop('burnout_risk', axis=1)
        y_burn = df_burnout['burnout_risk']
        
        X_burn_train, X_burn_test, y_burn_train, y_burn_test = train_test_split(
            X_burn, y_burn, test_size=0.2, random_state=42
        )
        
        scaler_burn = StandardScaler()
        X_burn_train_scaled = scaler_burn.fit_transform(X_burn_train)
        X_burn_test_scaled = scaler_burn.transform(X_burn_test)
        
        burnout_model = RandomForestClassifier(
            n_estimators=100, 
            class_weight='balanced', 
            random_state=42
        )
        burnout_model.fit(X_burn_train_scaled, y_burn_train)
        
        score = burnout_model.score(X_burn_test_scaled, y_burn_test)
        print(f"✅ Burnout model trained ({score:.3f} accuracy)")
        
        self.models['burnout'] = burnout_model
        self.scalers['burnout'] = scaler_burn
        
        # Save all models
        self.save_models()
        print("\n✅ All models trained and saved successfully!")

    def save_models(self):
        """Save trained models to disk"""
        model_dir = 'models/staff'
        os.makedirs(model_dir, exist_ok=True)
        
        with open(f'{model_dir}/absenteeism_model.pkl', 'wb') as f:
            pickle.dump(self.models['absenteeism'], f)
        with open(f'{model_dir}/staffing_model.pkl', 'wb') as f:
            pickle.dump(self.models['staffing'], f)
        with open(f'{model_dir}/clustering_model.pkl', 'wb') as f:
            pickle.dump(self.models['clustering'], f)
        with open(f'{model_dir}/burnout_model.pkl', 'wb') as f:
            pickle.dump(self.models['burnout'], f)
        with open(f'{model_dir}/scalers.pkl', 'wb') as f:
            pickle.dump(self.scalers, f)
        
        # Save metadata
        metadata = {
            'trained_date': datetime.now().isoformat(),
            'models': {
                'absenteeism': str(type(self.models['absenteeism']).__name__),
                'staffing': 'RandomForestRegressor',
                'clustering': 'KMeans',
                'burnout': 'RandomForestClassifier'
            },
            'cluster_labels': self.cluster_labels
        }
        
        with open(f'{model_dir}/metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
    
    def predict_absenteeism(self, staff_features):
        """
        Predict absenteeism risk for a staff member
        
        Args:
            staff_features: dict with keys:
                - absence_last_7_days
                - absence_last_30_days
                - shift_type (0=Day, 1=Night, 2=Rotating)
                - distance_km
                - experience_years
                - department_workload
                - day_of_week
                - is_weekend
                - is_holiday
                - season
                - consecutive_shifts
        
        Returns:
            dict with probability and risk level
        """
        try:
            # Convert to DataFrame
            features = pd.DataFrame([staff_features])
            
            # Scale features
            features_scaled = self.scalers['absenteeism'].transform(features)
            
            # Predict
            probability = self.models['absenteeism'].predict_proba(features_scaled)[0][1] * 100
            
            # Determine risk level
            if probability < 30:
                risk_level = 'Low'
            elif probability < 60:
                risk_level = 'Medium'
            else:
                risk_level = 'High'
            
            return {
                'probability': round(probability, 2),
                'riskLevel': risk_level,
                'lastUpdated': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error predicting absenteeism: {e}")
            return {
                'probability': None,
                'riskLevel': 'Unknown',
                'error': str(e)
            }
    
    def predict_staffing_needs(self, date_features):
        """
        Predict staffing needs for a given date
        
        Args:
            date_features: dict with keys:
                - day_of_week
                - month
                - is_weekend
                - is_holiday
                - season
                - admissions_last_7_days
                - admissions_last_30_days
                - department_type
        
        Returns:
            int: predicted staff count needed
        """
        try:
            features = pd.DataFrame([date_features])
            features_scaled = self.scalers['staffing'].transform(features)
            
            prediction = self.models['staffing'].predict(features_scaled)[0]
            return max(1, int(round(prediction)))
        except Exception as e:
            print(f"Error predicting staffing needs: {e}")
            return None
    
    def cluster_staff(self, staff_features):
        """
        Assign staff to a cluster
        
        Args:
            staff_features: dict with keys:
                - experience_years
                - performance_rating
                - shift_preference (0=Day, 1=Night, 2=Rotating)
                - specialization_count
                - avg_hours_per_week
                - night_shift_frequency
        
        Returns:
            dict with cluster ID and label
        """
        try:
            features = pd.DataFrame([staff_features])
            features_scaled = self.scalers['clustering'].transform(features)
            
            cluster_id = int(self.models['clustering'].predict(features_scaled)[0])
            cluster_label = self.cluster_labels.get(cluster_id, f"Cluster {cluster_id}")
            
            return {
                'id': cluster_id,
                'label': cluster_label,
                'lastUpdated': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error clustering staff: {e}")
            return {
                'id': None,
                'label': 'Unassigned',
                'error': str(e)
            }
    
    def predict_burnout(self, staff_features):
        """
        Predict burnout risk for a staff member
        
        Args:
            staff_features: dict with keys:
                - consecutive_shifts
                - avg_hours_per_week
                - night_shifts_last_month
                - avg_patient_load
                - days_since_last_leave
                - years_in_current_role
                - overtime_hours
        
        Returns:
            dict with risk level and score
        """
        try:
            features = pd.DataFrame([staff_features])
            features_scaled = self.scalers['burnout'].transform(features)
            
            prediction = self.models['burnout'].predict(features_scaled)[0]
            probabilities = self.models['burnout'].predict_proba(features_scaled)[0]
            
            risk_levels = ['Low', 'Medium', 'High']
            risk_level = risk_levels[prediction]
            score = round(probabilities[prediction] * 100, 2)
            
            return {
                'level': risk_level,
                'score': score,
                'lastUpdated': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error predicting burnout: {e}")
            return {
                'level': 'Unknown',
                'score': None,
                'error': str(e)
            }
    
    def get_model_info(self):
        """Get information about loaded models"""
        return {
            'models_loaded': list(self.models.keys()),
            'absenteeism_model': str(type(self.models.get('absenteeism')).__name__),
            'staffing_model': 'RandomForestRegressor',
            'clustering_model': 'KMeans (k=5)',
            'burnout_model': 'RandomForestClassifier',
            'cluster_labels': self.cluster_labels,
            'status': 'active'
        }

# Global instance
staff_predictor = None

def get_staff_predictor():
    """Get or create staff predictor instance"""
    global staff_predictor
    if staff_predictor is None:
        staff_predictor = StaffPredictor()
    return staff_predictor
