#!/usr/bin/env python3
"""
Quick test of Staff Management ML predictions
"""

from staff_predictor import get_staff_predictor
import json

print("=" * 60)
print("STAFF MANAGEMENT ML PREDICTIONS - DEMO")
print("=" * 60)

# Initialize predictor
predictor = get_staff_predictor()

# Test 1: Absenteeism Prediction
print("\n1️⃣  ABSENTEEISM RISK PREDICTION")
print("-" * 60)

staff_features = {
    'absence_last_7_days': 0,
    'absence_last_30_days': 2,
    'shift_type': 1,  # Night shift
    'distance_km': 25,
    'experience_years': 3,
    'department_workload': 20,
    'day_of_week': 1,  # Monday
    'is_weekend': 0,
    'is_holiday': 0,
    'season': 2,  # Summer
    'consecutive_shifts': 5
}

result = predictor.predict_absenteeism(staff_features)
print(f"Staff Profile: Night shift nurse, 25km away, 5 consecutive shifts")
print(f"Absenteeism Risk: {result['probability']}%")
print(f"Risk Level: {result['riskLevel']}")

# Test 2: Staffing Needs Prediction
print("\n2️⃣  STAFFING NEEDS FORECAST")
print("-" * 60)

date_features = {
    'day_of_week': 5,  # Saturday
    'month': 2,
    'is_weekend': 1,
    'is_holiday': 0,
    'season': 0,  # Winter
    'admissions_last_7_days': 65,
    'admissions_last_30_days': 250,
    'department_type': 1  # ER
}

staff_needed = predictor.predict_staffing_needs(date_features)
print(f"Department: Emergency Room")
print(f"Day: Saturday (Weekend)")
print(f"Recent Admissions: 65 (last 7 days)")
print(f"Predicted Staff Needed: {staff_needed}")

# Test 3: Staff Clustering
print("\n3️⃣  STAFF CLUSTERING")
print("-" * 60)

staff_profiles = [
    {
        'name': 'Dr. Senior',
        'features': {
            'experience_years': 15,
            'performance_rating': 5,
            'shift_preference': 0,  # Day
            'specialization_count': 3,
            'avg_hours_per_week': 45,
            'night_shift_frequency': 0.1
        }
    },
    {
        'name': 'Nurse Junior',
        'features': {
            'experience_years': 2,
            'performance_rating': 3,
            'shift_preference': 2,  # Rotating
            'specialization_count': 1,
            'avg_hours_per_week': 40,
            'night_shift_frequency': 0.4
        }
    },
    {
        'name': 'Tech Night',
        'features': {
            'experience_years': 8,
            'performance_rating': 4,
            'shift_preference': 1,  # Night
            'specialization_count': 2,
            'avg_hours_per_week': 38,
            'night_shift_frequency': 0.9
        }
    }
]

for staff in staff_profiles:
    cluster = predictor.cluster_staff(staff['features'])
    print(f"{staff['name']}: {cluster['label']} (Cluster {cluster['id']})")

# Test 4: Burnout Risk Prediction
print("\n4️⃣  BURNOUT RISK ASSESSMENT")
print("-" * 60)

burnout_features = {
    'consecutive_shifts': 12,
    'avg_hours_per_week': 65,
    'night_shifts_last_month': 15,
    'avg_patient_load': 25,
    'days_since_last_leave': 180,
    'years_in_current_role': 4,
    'overtime_hours': 30
}

burnout = predictor.predict_burnout(burnout_features)
print(f"Staff Profile: 12 consecutive shifts, 65 hrs/week, 180 days since leave")
print(f"Burnout Risk: {burnout['level']}")
print(f"Confidence Score: {burnout['score']}%")

# Model Info
print("\n5️⃣  ML MODEL INFORMATION")
print("-" * 60)

info = predictor.get_model_info()
print(f"Models Loaded: {', '.join(info['models_loaded'])}")
print(f"Absenteeism Model: {info['absenteeism_model']}")
print(f"Staffing Model: {info['staffing_model']}")
print(f"Clustering Model: {info['clustering_model']}")
print(f"Burnout Model: {info['burnout_model']}")
print(f"Status: {info['status'].upper()}")

print("\n" + "=" * 60)
print("✅ ALL ML MODELS WORKING SUCCESSFULLY!")
print("=" * 60)
print("\nNext Steps:")
print("1. Integrate backend routes: backend/routes/admin_staff.js")
print("2. Add ML routes to Flask: ml-service/staff_ml_routes.py")
print("3. Add frontend component: frontend/src/pages/StaffManagement/")
print("4. Test full integration with real data")
