#!/usr/bin/env python3
"""
Generate Synthetic Training Data
Creates synthetic assignment history data for training ML models
"""

import pandas as pd
import numpy as np
import os

def generate_assignment_history(num_samples=500):
    """
    Generate synthetic assignment history data
    
    Features:
    - current_load: 0-5 patients
    - availability: 0 or 1
    - expertise_match: 0.0-1.0
    - hours_remaining: 0-12 hours
    - experience_years: 1-25 years
    - performance_score: 0.7-1.0
    - department_match: 0 or 1
    - suitability_score: 0-100 (target variable)
    """
    np.random.seed(42)
    
    data = []
    
    for i in range(num_samples):
        # Generate features
        current_load = np.random.randint(0, 6)
        availability = np.random.choice([0, 1], p=[0.2, 0.8])  # 80% available
        expertise_match = np.random.beta(2, 2)  # Centered around 0.5
        hours_remaining = np.random.uniform(0, 12)
        experience_years = np.random.randint(1, 26)
        performance_score = np.random.uniform(0.7, 1.0)
        department_match = np.random.choice([0, 1], p=[0.3, 0.7])  # 70% match
        role = np.random.choice(['doctor', 'nurse'])
        
        # Calculate suitability score (rule-based for training data)
        score = 0.0
        
        # Availability (30%)
        score += availability * 30
        
        # Low workload (20%)
        load_score = max(0, (5 - current_load) / 5) * 20
        score += load_score
        
        # Expertise match (25%)
        score += expertise_match * 25
        
        # Hours remaining (10%)
        hours_score = min(hours_remaining / 8.0, 1.0) * 10
        score += hours_score
        
        # Experience (10%)
        exp_score = min(experience_years / 20.0, 1.0) * 10
        score += exp_score
        
        # Performance (5%)
        score += performance_score * 5
        
        # Add some noise
        score += np.random.normal(0, 3)
        score = max(0, min(100, score))  # Clip to 0-100
        
        data.append({
            'role': role,
            'current_load': current_load,
            'availability': availability,
            'expertise_match': round(expertise_match, 3),
            'hours_remaining': round(hours_remaining, 2),
            'experience_years': experience_years,
            'performance_score': round(performance_score, 3),
            'department_match': department_match,
            'suitability_score': round(score, 2)
        })
    
    df = pd.DataFrame(data)
    return df

def generate_routing_history(num_samples=300):
    """
    Generate synthetic routing history data for department classification
    
    Features: Simplified symptom patterns
    Target: Department
    """
    np.random.seed(42)
    
    departments = ['Cardiology', 'Neurology', 'General Medicine', 'Orthopedics', 
                   'Emergency', 'Pediatrics']
    
    data = []
    
    for i in range(num_samples):
        # Generate symptom features (simplified)
        chest_pain = np.random.choice([0, 1])
        headache = np.random.choice([0, 1])
        fever = np.random.choice([0, 1])
        fracture = np.random.choice([0, 1])
        breathing_difficulty = np.random.choice([0, 1])
        age = np.random.randint(1, 90)
        
        # Rule-based department assignment
        if chest_pain and breathing_difficulty:
            department = 'Cardiology'
            disease = 'Heart Disease'
        elif headache and not fever:
            department = 'Neurology'
            disease = 'Migraine'
        elif fever and age < 18:
            department = 'Pediatrics'
            disease = 'Child Fever'
        elif fracture:
            department = 'Orthopedics'
            disease = 'Fracture'
        elif breathing_difficulty and fever:
            department = 'Emergency'
            disease = 'Pneumonia'
        else:
            department = 'General Medicine'
            disease = 'Flu'
        
        data.append({
            'chest_pain': chest_pain,
            'headache': headache,
            'fever': fever,
            'fracture': fracture,
            'breathing_difficulty': breathing_difficulty,
            'age': age,
            'department': department,
            'disease': disease
        })
    
    df = pd.DataFrame(data)
    return df

def main():
    """Generate and save synthetic training data"""
    print("🔄 Generating synthetic training data...")
    
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Generate assignment history
    print("\n1. Generating assignment history data...")
    assignment_df = generate_assignment_history(num_samples=500)
    assignment_path = 'data/assignment_history.csv'
    assignment_df.to_csv(assignment_path, index=False)
    print(f"   ✅ Saved {len(assignment_df)} samples to {assignment_path}")
    print(f"   - Doctor samples: {len(assignment_df[assignment_df['role'] == 'doctor'])}")
    print(f"   - Nurse samples: {len(assignment_df[assignment_df['role'] == 'nurse'])}")
    
    # Generate routing history
    print("\n2. Generating routing history data...")
    routing_df = generate_routing_history(num_samples=300)
    routing_path = 'data/routing_history.csv'
    routing_df.to_csv(routing_path, index=False)
    print(f"   ✅ Saved {len(routing_df)} samples to {routing_path}")
    print(f"   - Departments: {routing_df['department'].nunique()}")
    
    # Display sample data
    print("\n📊 Sample Assignment History:")
    print(assignment_df.head())
    
    print("\n📊 Sample Routing History:")
    print(routing_df.head())
    
    print("\n✅ Synthetic data generation complete!")
    print("\nNext steps:")
    print("1. Train assignment models: python -c 'from staff_assignment import get_staff_assigner; s = get_staff_assigner(); s.train_assignment_models()'")
    print("2. Train routing model: python -c 'from routing_assigner import get_patient_router; r = get_patient_router(); r.train_ml_router()'")

if __name__ == '__main__':
    main()
