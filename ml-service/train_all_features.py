#!/usr/bin/env python3
"""
Train Enhanced ML Models Using ALL 132 Symptoms (No Feature Selection)
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

def load_data():
    """Load training and testing data"""
    print("Loading datasets...")
    
    # Load training data
    training_data = pd.read_csv('../Training.csv')
    testing_data = pd.read_csv('../Testing.csv')
    
    print(f"Training data: {training_data.shape}")
    print(f"Testing data: {testing_data.shape}")
    
    return training_data, testing_data

def preprocess_data(training_data, testing_data):
    """Preprocess data - NO FEATURE SELECTION, use all 132 symptoms"""
    print("Preprocessing data (using ALL 132 symptoms)...")
    
    # Remove any unnamed columns from training data
    training_data = training_data.loc[:, ~training_data.columns.str.contains('^Unnamed')]
    
    # Separate features and labels
    X_train_full = training_data.drop('prognosis', axis=1)
    y_train_full = training_data['prognosis']
    X_test = testing_data.drop('prognosis', axis=1)
    y_test = testing_data['prognosis']
    
    print(f"Training features after cleanup: {X_train_full.shape[1]}")
    print(f"Testing features: {X_test.shape[1]}")
    
    # Validate data consistency
    assert list(X_train_full.columns) == list(X_test.columns), "Feature mismatch between datasets"
    
    # Use ALL features (no feature selection)
    print(f"Using ALL {len(X_train_full.columns)} symptoms (no feature selection)")
    
    # Create train/validation split
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_full, y_train_full, 
        test_size=0.2, 
        random_state=42, 
        stratify=y_train_full
    )
    
    # Create scaler for SVM
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)
    
    return {
        'X_train': X_train,
        'X_val': X_val,
        'X_test': X_test,
        'y_train': y_train,
        'y_val': y_val,
        'y_test': y_test,
        'X_train_scaled': X_train_scaled,
        'X_val_scaled': X_val_scaled,
        'X_test_scaled': X_test_scaled,
        'scaler': scaler,
        'feature_names': list(X_train_full.columns),
        'all_features': None  # No feature selection
    }

def train_models(data):
    """Train multiple ML models using all 132 symptoms"""
    print("Training models with ALL 132 symptoms...")
    
    models = {}
    performance = {}
    
    # 1. Random Forest
    print("Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(data['X_train'], data['y_train'])
    models['random_forest'] = rf
    
    # 2. SVM (with scaling)
    print("Training SVM...")
    svm = SVC(
        kernel='rbf',
        C=1.0,
        gamma='scale',
        probability=True,
        random_state=42
    )
    svm.fit(data['X_train_scaled'], data['y_train'])
    models['svm'] = svm
    
    # 3. Gradient Boosting
    print("Training Gradient Boosting...")
    gb = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=6,
        random_state=42
    )
    gb.fit(data['X_train'], data['y_train'])
    models['gradient_boosting'] = gb
    
    # 4. Extra Trees
    print("Training Extra Trees...")
    et = ExtraTreesClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1
    )
    et.fit(data['X_train'], data['y_train'])
    models['extra_trees'] = et
    
    # 5. Enhanced Ensemble
    print("Training Enhanced Ensemble...")
    ensemble = VotingClassifier(
        estimators=[
            ('rf', rf),
            ('gb', gb),
            ('et', et)
        ],
        voting='soft'
    )
    ensemble.fit(data['X_train'], data['y_train'])
    models['enhanced_ensemble'] = ensemble
    
    return models

def evaluate_models(models, data):
    """Evaluate all models"""
    print("Evaluating models...")
    
    performance = {}
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    for name, model in models.items():
        print(f"\nEvaluating {name}...")
        
        # Determine if model needs scaling
        needs_scaling = (name == 'svm')
        
        # Validation predictions
        if needs_scaling:
            val_pred = model.predict(data['X_val_scaled'])
            val_proba = model.predict_proba(data['X_val_scaled'])
        else:
            val_pred = model.predict(data['X_val'])
            val_proba = model.predict_proba(data['X_val'])
        
        val_accuracy = accuracy_score(data['y_val'], val_pred)
        val_f1 = f1_score(data['y_val'], val_pred, average='weighted')
        
        # Test predictions
        if needs_scaling:
            test_pred = model.predict(data['X_test_scaled'])
        else:
            test_pred = model.predict(data['X_test'])
        
        test_accuracy = accuracy_score(data['y_test'], test_pred)
        test_f1 = f1_score(data['y_test'], test_pred, average='weighted')
        
        # Cross-validation
        if needs_scaling:
            cv_scores = cross_val_score(model, data['X_train_scaled'], data['y_train'], 
                                      cv=cv, scoring='f1_weighted')
        else:
            cv_scores = cross_val_score(model, data['X_train'], data['y_train'], 
                                      cv=cv, scoring='f1_weighted')
        
        performance[name] = {
            'validation_accuracy': val_accuracy,
            'validation_f1': val_f1,
            'test_accuracy': test_accuracy,
            'test_f1': test_f1,
            'cv_mean_f1': cv_scores.mean(),
            'cv_std_f1': cv_scores.std(),
            'needs_scaling': needs_scaling
        }
        
        print(f"  Validation Accuracy: {val_accuracy:.4f}")
        print(f"  Test Accuracy: {test_accuracy:.4f}")
        print(f"  CV F1 Score: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    
    return performance

def save_models(models, data, performance):
    """Save all models and metadata"""
    print("Saving models...")
    
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    # Save individual models
    for name, model in models.items():
        joblib.dump(model, f'models/{name}.pkl')
        print(f"Saved {name}.pkl")
    
    # Save scaler
    joblib.dump(data['scaler'], 'models/scaler.pkl')
    print("Saved scaler.pkl")
    
    # Save symptom columns
    joblib.dump(data['feature_names'], 'models/symptom_columns.pkl')
    print("Saved symptom_columns.pkl")
    
    # NO feature selection file (using all features)
    # This will signal the predictor to use all features
    
    # Find best model
    best_model = max(performance.items(), key=lambda x: x[1]['test_accuracy'])
    best_model_name = best_model[0]
    best_accuracy = best_model[1]['test_accuracy']
    
    # Create metadata
    metadata = {
        'version': datetime.now().strftime('%Y%m%d_%H%M%S'),
        'training_date': datetime.now().isoformat(),
        'model_type': 'all_features_v1',
        'models': list(models.keys()),
        'best_model': best_model_name,
        'best_score': best_accuracy,
        'best_accuracy': best_accuracy,
        'performance': performance,
        'selected_features_count': len(data['feature_names']),  # All 132
        'total_features': len(data['feature_names']),  # All 132
        'training_samples': len(data['X_train']) + len(data['X_val']),
        'testing_samples': len(data['X_test']),
        'enhancements': [
            'Using ALL 132 symptoms (no feature selection)',
            'Optimized hyperparameters',
            'Robust scaling for SVM',
            'Enhanced ensemble voting',
            'Comprehensive evaluation'
        ]
    }
    
    # Save metadata
    with open('models/metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    print("Saved metadata.json")
    
    return metadata

def main():
    """Main training pipeline using ALL 132 symptoms"""
    print("="*60)
    print("TRAINING ML MODELS WITH ALL 132 SYMPTOMS")
    print("="*60)
    
    # Load data
    training_data, testing_data = load_data()
    
    # Preprocess (no feature selection)
    data = preprocess_data(training_data, testing_data)
    
    # Train models
    models = train_models(data)
    
    # Evaluate models
    performance = evaluate_models(models, data)
    
    # Save everything
    metadata = save_models(models, data, performance)
    
    # Print summary
    print("\n" + "="*60)
    print("TRAINING COMPLETE - ALL 132 SYMPTOMS")
    print("="*60)
    print(f"Model version: {metadata['version']}")
    print(f"Best model: {metadata['best_model']}")
    print(f"Best accuracy: {metadata['best_accuracy']:.4f}")
    print(f"Features used: {metadata['selected_features_count']} (ALL symptoms)")
    print(f"Training samples: {metadata['training_samples']}")
    print(f"Testing samples: {metadata['testing_samples']}")
    
    print("\nModel Performance Summary:")
    for name, perf in performance.items():
        print(f"  {name}: {perf['test_accuracy']:.4f} test accuracy")
    
    print("\nModels saved to 'models/' directory")
    print("Ready for deployment!")

if __name__ == "__main__":
    main()