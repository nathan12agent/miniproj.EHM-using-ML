"""
Staff Management ML Routes
Add these routes to app.py
"""

from flask import request, jsonify
import pandas as pd
from datetime import datetime, timedelta
from staff_predictor import get_staff_predictor

# Initialize staff predictor
try:
    staff_predictor = get_staff_predictor()
    print("Staff predictor initialized successfully")
except Exception as e:
    print(f"Error initializing staff predictor: {e}")
    staff_predictor = None

def register_staff_routes(app):
    """Register staff ML prediction routes"""
    
    @app.route('/ml/staff/predict_absenteeism', methods=['POST'])
    def predict_staff_absenteeism():
        """Predict absenteeism for a single staff member or all staff"""
        if not staff_predictor:
            return jsonify({'error': 'Staff predictor not available'}), 500
        
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            # Single staff prediction
            if 'staff_features' in data:
                features = data['staff_features']
                prediction = staff_predictor.predict_absenteeism(features)
                
                return jsonify({
                    'success': True,
                    'prediction': prediction,
                    'timestamp': datetime.now().isoformat()
                })
            
            # Batch prediction for all staff
            elif 'staff_list' in data:
                staff_list = data['staff_list']
                predictions = []
                
                for staff in staff_list:
                    features = {
                        'absence_last_7_days': staff.get('absence_last_7_days', 0),
                        'absence_last_30_days': staff.get('absence_last_30_days', 0),
                        'shift_type': {'Day': 0, 'Night': 1, 'Rotating': 2}.get(staff.get('shiftPreference', 'Day'), 0),
                        'distance_km': staff.get('distanceFromHospital', 10),
                        'experience_years': staff.get('experienceYears', 5),
                        'department_workload': staff.get('department_workload', 15),
                        'day_of_week': datetime.now().weekday(),
                        'is_weekend': 1 if datetime.now().weekday() >= 5 else 0,
                        'is_holiday': 0,  # TODO: Check holiday calendar
                        'season': (datetime.now().month % 12) // 3,
                        'consecutive_shifts': staff.get('consecutive_shifts', 0)
                    }
                    
                    prediction = staff_predictor.predict_absenteeism(features)
                    predictions.append({
                        'staff_id': staff.get('_id'),
                        'prediction': prediction
                    })
                
                return jsonify({
                    'success': True,
                    'predictions': predictions,
                    'count': len(predictions),
                    'timestamp': datetime.now().isoformat()
                })
            
            else:
                return jsonify({'error': 'Invalid request format'}), 400
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/ml/staff/predict_staffing', methods=['POST'])
    def predict_staffing_needs():
        """Predict staffing needs for next 7 days"""
        if not staff_predictor:
            return jsonify({'error': 'Staff predictor not available'}), 500
        
        try:
            data = request.get_json() or {}
            department = data.get('department', 'General Ward')
            
            predictions = []
            today = datetime.now()
            
            for i in range(7):
                target_date = today + timedelta(days=i)
                
                features = {
                    'day_of_week': target_date.weekday(),
                    'month': target_date.month,
                    'is_weekend': 1 if target_date.weekday() >= 5 else 0,
                    'is_holiday': 0,  # TODO: Check holiday calendar
                    'season': (target_date.month % 12) // 3,
                    'admissions_last_7_days': data.get('admissions_last_7_days', 50),
                    'admissions_last_30_days': data.get('admissions_last_30_days', 200),
                    'department_type': {'ICU': 0, 'ER': 1, 'General Ward': 2, 'Lab': 3, 'Admin': 4}.get(department, 2)
                }
                
                staff_needed = staff_predictor.predict_staffing_needs(features)
                
                predictions.append({
                    'date': target_date.strftime('%Y-%m-%d'),
                    'day_of_week': target_date.strftime('%A'),
                    'staff_needed': staff_needed,
                    'department': department
                })
            
            return jsonify({
                'success': True,
                'predictions': predictions,
                'department': department,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/ml/staff/cluster_staff', methods=['POST'])
    def cluster_staff():
        """Cluster staff members"""
        if not staff_predictor:
            return jsonify({'error': 'Staff predictor not available'}), 500
        
        try:
            data = request.get_json()
            
            if not data or 'staff_list' not in data:
                return jsonify({'error': 'No staff data provided'}), 400
            
            staff_list = data['staff_list']
            clusters = []
            
            for staff in staff_list:
                features = {
                    'experience_years': staff.get('experienceYears', 5),
                    'performance_rating': staff.get('performanceRating', 3),
                    'shift_preference': {'Day': 0, 'Night': 1, 'Rotating': 2}.get(staff.get('shiftPreference', 'Day'), 0),
                    'specialization_count': len(staff.get('specialization', [])),
                    'avg_hours_per_week': staff.get('avg_hours_per_week', 40),
                    'night_shift_frequency': staff.get('night_shift_frequency', 0.3)
                }
                
                cluster = staff_predictor.cluster_staff(features)
                clusters.append({
                    'staff_id': staff.get('_id'),
                    'cluster': cluster
                })
            
            return jsonify({
                'success': True,
                'clusters': clusters,
                'count': len(clusters),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/ml/staff/predict_burnout', methods=['POST'])
    def predict_burnout():
        """Predict burnout risk for staff"""
        if not staff_predictor:
            return jsonify({'error': 'Staff predictor not available'}), 500
        
        try:
            data = request.get_json()
            
            if not data or 'staff_list' not in data:
                return jsonify({'error': 'No staff data provided'}), 400
            
            staff_list = data['staff_list']
            predictions = []
            
            for staff in staff_list:
                features = {
                    'consecutive_shifts': staff.get('consecutive_shifts', 0),
                    'avg_hours_per_week': staff.get('avg_hours_per_week', 40),
                    'night_shifts_last_month': staff.get('night_shifts_last_month', 5),
                    'avg_patient_load': staff.get('avg_patient_load', 15),
                    'days_since_last_leave': staff.get('days_since_last_leave', 30),
                    'years_in_current_role': staff.get('experienceYears', 5),
                    'overtime_hours': staff.get('overtime_hours', 0)
                }
                
                burnout = staff_predictor.predict_burnout(features)
                predictions.append({
                    'staff_id': staff.get('_id'),
                    'burnout': burnout
                })
            
            return jsonify({
                'success': True,
                'predictions': predictions,
                'count': len(predictions),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/ml/staff/model_info', methods=['GET'])
    def get_staff_model_info():
        """Get staff ML model information"""
        if not staff_predictor:
            return jsonify({'error': 'Staff predictor not available'}), 500
        
        try:
            info = staff_predictor.get_model_info()
            return jsonify({
                'success': True,
                'model_info': info,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/ml/staff/train_models', methods=['POST'])
    def train_staff_models():
        """Retrain staff ML models (admin only)"""
        if not staff_predictor:
            return jsonify({'error': 'Staff predictor not available'}), 500
        
        try:
            staff_predictor.train_models_with_synthetic_data()
            
            return jsonify({
                'success': True,
                'message': 'Models retrained successfully',
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
