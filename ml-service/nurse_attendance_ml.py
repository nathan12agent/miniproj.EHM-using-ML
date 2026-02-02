"""
ML-Powered Nurse Attendance Management System
Features:
- Attendance pattern prediction
- Absence risk prediction
- Optimal shift scheduling
- Workload balancing
- Anomaly detection
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import joblib
import json

class NurseAttendanceML:
    def __init__(self):
        self.absence_predictor = None
        self.workload_predictor = None
        self.scaler = StandardScaler()
        self.shift_optimizer = None
        
    def prepare_features(self, attendance_data):
        """
        Prepare features from attendance data
        """
        df = pd.DataFrame(attendance_data)
        
        features = {
            'day_of_week': df['date'].dt.dayofweek,
            'month': df['date'].dt.month,
            'is_weekend': df['date'].dt.dayofweek.isin([5, 6]).astype(int),
            'shift_type': df['shift'].map({'Morning': 0, 'Evening': 1, 'Night': 2, 'General': 3}),
            'previous_absences': self._calculate_previous_absences(df),
            'consecutive_days': self._calculate_consecutive_days(df),
            'hours_worked_week': self._calculate_weekly_hours(df),
            'break_frequency': self._calculate_break_frequency(df),
            'late_arrivals': self._calculate_late_arrivals(df),
        }
        
        return pd.DataFrame(features)
    
    def _calculate_previous_absences(self, df):
        """Calculate number of absences in last 30 days"""
        absences = []
        for idx, row in df.iterrows():
            date = row['date']
            past_30_days = df[(df['date'] >= date - timedelta(days=30)) & 
                             (df['date'] < date) & 
                             (df['status'] == 'Absent')]
            absences.append(len(past_30_days))
        return absences
    
    def _calculate_consecutive_days(self, df):
        """Calculate consecutive working days"""
        consecutive = []
        for idx, row in df.iterrows():
            date = row['date']
            count = 0
            current_date = date - timedelta(days=1)
            while current_date in df['date'].values:
                if df[df['date'] == current_date]['status'].values[0] == 'Present':
                    count += 1
                    current_date -= timedelta(days=1)
                else:
                    break
            consecutive.append(count)
        return consecutive
    
    def _calculate_weekly_hours(self, df):
        """Calculate total hours worked in current week"""
        weekly_hours = []
        for idx, row in df.iterrows():
            date = row['date']
            week_start = date - timedelta(days=date.weekday())
            week_data = df[(df['date'] >= week_start) & (df['date'] <= date)]
            total_hours = week_data['totalHours'].sum()
            weekly_hours.append(total_hours)
        return weekly_hours
    
    def _calculate_break_frequency(self, df):
        """Calculate average breaks per day"""
        return df['breaks'].apply(lambda x: len(x) if isinstance(x, list) else 0)
    
    def _calculate_late_arrivals(self, df):
        """Calculate late arrivals in last 30 days"""
        late_count = []
        for idx, row in df.iterrows():
            date = row['date']
            past_30_days = df[(df['date'] >= date - timedelta(days=30)) & 
                             (df['date'] < date) & 
                             (df['status'] == 'Late')]
            late_count.append(len(past_30_days))
        return late_count
    
    def train_absence_predictor(self, historical_data):
        """
        Train model to predict absence probability
        """
        features = self.prepare_features(historical_data)
        labels = (historical_data['status'] == 'Absent').astype(int)
        
        # Scale features
        features_scaled = self.scaler.fit_transform(features)
        
        # Train Random Forest
        self.absence_predictor = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.absence_predictor.fit(features_scaled, labels)
        
        # Save model
        joblib.dump(self.absence_predictor, 'models/absence_predictor.pkl')
        joblib.dump(self.scaler, 'models/scaler.pkl')
        
        return {
            'accuracy': self.absence_predictor.score(features_scaled, labels),
            'feature_importance': dict(zip(features.columns, 
                                          self.absence_predictor.feature_importances_))
        }
    
    def predict_absence_risk(self, nurse_data):
        """
        Predict probability of absence for a nurse
        Returns: risk score (0-1) and risk level
        """
        if not self.absence_predictor:
            self.absence_predictor = joblib.load('models/absence_predictor.pkl')
            self.scaler = joblib.load('models/scaler.pkl')
        
        features = self.prepare_features([nurse_data])
        features_scaled = self.scaler.transform(features)
        
        risk_score = self.absence_predictor.predict_proba(features_scaled)[0][1]
        
        if risk_score > 0.7:
            risk_level = 'High'
        elif risk_score > 0.4:
            risk_level = 'Medium'
        else:
            risk_level = 'Low'
        
        return {
            'risk_score': float(risk_score),
            'risk_level': risk_level,
            'recommendations': self._generate_recommendations(risk_score, nurse_data)
        }
    
    def _generate_recommendations(self, risk_score, nurse_data):
        """Generate recommendations based on risk score"""
        recommendations = []
        
        if risk_score > 0.7:
            recommendations.append("High absence risk detected. Consider backup staffing.")
            recommendations.append("Schedule wellness check-in with nurse.")
        
        if nurse_data.get('consecutive_days', 0) > 6:
            recommendations.append("Nurse has worked many consecutive days. Schedule rest day.")
        
        if nurse_data.get('hours_worked_week', 0) > 45:
            recommendations.append("High weekly hours. Monitor for burnout.")
        
        if nurse_data.get('late_arrivals', 0) > 3:
            recommendations.append("Multiple late arrivals. Discuss scheduling concerns.")
        
        return recommendations
    
    def optimize_shift_schedule(self, nurses_data, requirements):
        """
        Optimize shift scheduling using ML
        
        Args:
            nurses_data: List of nurse availability and preferences
            requirements: Shift requirements (min nurses per shift)
        
        Returns:
            Optimized schedule
        """
        schedule = {
            'Morning': [],
            'Evening': [],
            'Night': []
        }
        
        # Calculate nurse scores for each shift
        for nurse in nurses_data:
            nurse_id = nurse['id']
            
            # Factors to consider:
            # 1. Absence risk
            # 2. Recent hours worked
            # 3. Shift preferences
            # 4. Consecutive days
            # 5. Last shift type
            
            absence_risk = self.predict_absence_risk(nurse)['risk_score']
            recent_hours = nurse.get('hours_worked_week', 0)
            consecutive_days = nurse.get('consecutive_days', 0)
            
            # Calculate suitability score for each shift
            for shift in ['Morning', 'Evening', 'Night']:
                score = 1.0
                
                # Penalize high absence risk
                score *= (1 - absence_risk)
                
                # Penalize overworked nurses
                if recent_hours > 40:
                    score *= 0.7
                
                # Penalize too many consecutive days
                if consecutive_days > 5:
                    score *= 0.6
                
                # Prefer nurse's preferred shift
                if nurse.get('preferred_shift') == shift:
                    score *= 1.3
                
                # Avoid same shift repeatedly
                if nurse.get('last_shift') == shift:
                    score *= 0.8
                
                schedule[shift].append({
                    'nurse_id': nurse_id,
                    'name': nurse['name'],
                    'score': score,
                    'absence_risk': absence_risk
                })
        
        # Sort and select top nurses for each shift
        optimized_schedule = {}
        for shift, nurses in schedule.items():
            sorted_nurses = sorted(nurses, key=lambda x: x['score'], reverse=True)
            required_count = requirements.get(shift, 3)
            optimized_schedule[shift] = sorted_nurses[:required_count]
        
        return optimized_schedule
    
    def detect_attendance_anomalies(self, attendance_records):
        """
        Detect unusual attendance patterns using clustering
        """
        features = self.prepare_features(attendance_records)
        
        # Use KMeans to find anomalies
        kmeans = KMeans(n_clusters=3, random_state=42)
        clusters = kmeans.fit_predict(features)
        
        # Calculate distance from cluster centers
        distances = kmeans.transform(features)
        min_distances = distances.min(axis=1)
        
        # Anomalies are points far from any cluster
        threshold = np.percentile(min_distances, 95)
        anomalies = min_distances > threshold
        
        anomaly_records = []
        for idx, is_anomaly in enumerate(anomalies):
            if is_anomaly:
                record = attendance_records.iloc[idx]
                anomaly_records.append({
                    'date': record['date'],
                    'nurse_id': record['nurse_id'],
                    'anomaly_score': float(min_distances[idx]),
                    'reason': self._identify_anomaly_reason(record)
                })
        
        return anomaly_records
    
    def _identify_anomaly_reason(self, record):
        """Identify why a record is anomalous"""
        reasons = []
        
        if record.get('totalHours', 0) > 12:
            reasons.append("Unusually long shift")
        
        if record.get('totalHours', 0) < 2:
            reasons.append("Unusually short shift")
        
        if len(record.get('breaks', [])) > 5:
            reasons.append("Excessive breaks")
        
        if record.get('status') == 'Late' and record.get('late_arrivals', 0) == 0:
            reasons.append("Uncharacteristic late arrival")
        
        return reasons if reasons else ["Unusual pattern detected"]
    
    def predict_staffing_needs(self, historical_data, forecast_days=7):
        """
        Predict staffing needs for upcoming days
        """
        # Analyze historical patterns
        df = pd.DataFrame(historical_data)
        
        predictions = []
        for day in range(forecast_days):
            future_date = datetime.now() + timedelta(days=day)
            
            # Features for prediction
            day_of_week = future_date.weekday()
            is_weekend = day_of_week in [5, 6]
            
            # Historical average for this day of week
            same_day_data = df[df['date'].dt.dayofweek == day_of_week]
            avg_present = same_day_data[same_day_data['status'] == 'Present'].groupby('date').size().mean()
            avg_absent = same_day_data[same_day_data['status'] == 'Absent'].groupby('date').size().mean()
            
            # Adjust for trends
            if is_weekend:
                avg_absent *= 1.2  # More absences on weekends
            
            predictions.append({
                'date': future_date.strftime('%Y-%m-%d'),
                'day_of_week': future_date.strftime('%A'),
                'predicted_present': int(avg_present),
                'predicted_absent': int(avg_absent),
                'recommended_backup': int(avg_absent * 0.5),
                'confidence': 0.85 if not is_weekend else 0.75
            })
        
        return predictions
    
    def analyze_workload_balance(self, nurses_data):
        """
        Analyze workload distribution among nurses
        """
        df = pd.DataFrame(nurses_data)
        
        analysis = {
            'total_nurses': len(df),
            'avg_hours_per_nurse': df['totalHours'].mean(),
            'std_hours': df['totalHours'].std(),
            'max_hours': df['totalHours'].max(),
            'min_hours': df['totalHours'].min(),
            'overworked_nurses': [],
            'underutilized_nurses': [],
            'balance_score': 0
        }
        
        # Identify overworked nurses (>45 hours/week)
        overworked = df[df['totalHours'] > 45]
        analysis['overworked_nurses'] = overworked[['nurse_id', 'name', 'totalHours']].to_dict('records')
        
        # Identify underutilized nurses (<30 hours/week)
        underutilized = df[df['totalHours'] < 30]
        analysis['underutilized_nurses'] = underutilized[['nurse_id', 'name', 'totalHours']].to_dict('records')
        
        # Calculate balance score (0-100, higher is better)
        # Lower standard deviation = better balance
        max_std = 20  # Maximum expected std
        balance_score = max(0, 100 - (analysis['std_hours'] / max_std * 100))
        analysis['balance_score'] = round(balance_score, 2)
        
        # Recommendations
        analysis['recommendations'] = []
        if balance_score < 70:
            analysis['recommendations'].append("Workload imbalance detected. Redistribute shifts.")
        if len(overworked) > 0:
            analysis['recommendations'].append(f"{len(overworked)} nurses are overworked. Reduce their hours.")
        if len(underutilized) > 0:
            analysis['recommendations'].append(f"{len(underutilized)} nurses are underutilized. Assign more shifts.")
        
        return analysis
    
    def generate_attendance_insights(self, attendance_data):
        """
        Generate comprehensive insights from attendance data
        """
        df = pd.DataFrame(attendance_data)
        
        insights = {
            'overall_attendance_rate': (len(df[df['status'] == 'Present']) / len(df) * 100),
            'average_hours_per_day': df['totalHours'].mean(),
            'most_common_absence_day': df[df['status'] == 'Absent']['date'].dt.day_name().mode()[0] if len(df[df['status'] == 'Absent']) > 0 else 'None',
            'peak_attendance_time': 'Morning',  # Can be calculated from clock-in times
            'trends': {
                'attendance_improving': self._calculate_trend(df, 'Present'),
                'late_arrivals_trend': self._calculate_trend(df, 'Late'),
                'absence_trend': self._calculate_trend(df, 'Absent')
            },
            'patterns': self._identify_patterns(df),
            'alerts': self._generate_alerts(df)
        }
        
        return insights
    
    def _calculate_trend(self, df, status):
        """Calculate if a status is trending up or down"""
        df_sorted = df.sort_values('date')
        first_half = df_sorted[:len(df_sorted)//2]
        second_half = df_sorted[len(df_sorted)//2:]
        
        first_rate = len(first_half[first_half['status'] == status]) / len(first_half)
        second_rate = len(second_half[second_half['status'] == status]) / len(second_half)
        
        if second_rate > first_rate * 1.1:
            return 'Increasing'
        elif second_rate < first_rate * 0.9:
            return 'Decreasing'
        else:
            return 'Stable'
    
    def _identify_patterns(self, df):
        """Identify attendance patterns"""
        patterns = []
        
        # Weekend pattern
        weekend_absence_rate = len(df[(df['date'].dt.dayofweek.isin([5,6])) & (df['status'] == 'Absent')]) / len(df[df['date'].dt.dayofweek.isin([5,6])])
        weekday_absence_rate = len(df[(~df['date'].dt.dayofweek.isin([5,6])) & (df['status'] == 'Absent')]) / len(df[~df['date'].dt.dayofweek.isin([5,6])])
        
        if weekend_absence_rate > weekday_absence_rate * 1.5:
            patterns.append("Higher absences on weekends")
        
        # Monday pattern
        monday_absence_rate = len(df[(df['date'].dt.dayofweek == 0) & (df['status'] == 'Absent')]) / len(df[df['date'].dt.dayofweek == 0])
        if monday_absence_rate > weekday_absence_rate * 1.3:
            patterns.append("Monday blues: Higher absences on Mondays")
        
        return patterns
    
    def _generate_alerts(self, df):
        """Generate alerts based on data"""
        alerts = []
        
        recent_data = df[df['date'] >= datetime.now() - timedelta(days=7)]
        
        # High absence rate alert
        absence_rate = len(recent_data[recent_data['status'] == 'Absent']) / len(recent_data) * 100
        if absence_rate > 15:
            alerts.append({
                'level': 'High',
                'message': f'Absence rate is {absence_rate:.1f}% in the last 7 days',
                'action': 'Investigate causes and arrange backup staff'
            })
        
        # Late arrival spike
        late_rate = len(recent_data[recent_data['status'] == 'Late']) / len(recent_data) * 100
        if late_rate > 20:
            alerts.append({
                'level': 'Medium',
                'message': f'Late arrival rate is {late_rate:.1f}%',
                'action': 'Review shift timings and transportation issues'
            })
        
        return alerts

# Flask API endpoints
from flask import Flask, request, jsonify

app = Flask(__name__)
ml_system = NurseAttendanceML()

@app.route('/ml/nurse-attendance/predict-absence', methods=['POST'])
def predict_absence():
    """Predict absence risk for a nurse"""
    data = request.json
    result = ml_system.predict_absence_risk(data)
    return jsonify(result)

@app.route('/ml/nurse-attendance/optimize-schedule', methods=['POST'])
def optimize_schedule():
    """Optimize shift schedule"""
    data = request.json
    nurses_data = data.get('nurses', [])
    requirements = data.get('requirements', {})
    result = ml_system.optimize_shift_schedule(nurses_data, requirements)
    return jsonify(result)

@app.route('/ml/nurse-attendance/detect-anomalies', methods=['POST'])
def detect_anomalies():
    """Detect attendance anomalies"""
    data = request.json
    result = ml_system.detect_attendance_anomalies(pd.DataFrame(data))
    return jsonify({'anomalies': result})

@app.route('/ml/nurse-attendance/predict-staffing', methods=['POST'])
def predict_staffing():
    """Predict staffing needs"""
    data = request.json
    historical_data = data.get('historical_data', [])
    forecast_days = data.get('forecast_days', 7)
    result = ml_system.predict_staffing_needs(historical_data, forecast_days)
    return jsonify({'predictions': result})

@app.route('/ml/nurse-attendance/analyze-workload', methods=['POST'])
def analyze_workload():
    """Analyze workload balance"""
    data = request.json
    result = ml_system.analyze_workload_balance(data)
    return jsonify(result)

@app.route('/ml/nurse-attendance/insights', methods=['POST'])
def get_insights():
    """Generate attendance insights"""
    data = request.json
    result = ml_system.generate_attendance_insights(data)
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
