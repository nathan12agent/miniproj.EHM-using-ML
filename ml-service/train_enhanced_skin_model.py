#!/usr/bin/env python3
"""
Enhanced Skin Disease Model Training Script
This script would train an improved skin disease classification model
with advanced techniques for higher accuracy.
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import pickle
import json
from datetime import datetime

class EnhancedSkinModelTrainer:
    def __init__(self):
        self.models = {}
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_names = []
        self.class_names = [
            'Acne and Rosacea Photos',
            'Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions',
            'Atopic Dermatitis Photos',
            'Bullous Disease Photos',
            'Cellulitis Impetigo and other Bacterial Infections',
            'Eczema Photos',
            'Exanthems and Drug Eruptions',
            'Hair Loss Photos Alopecia and other Hair Diseases',
            'Herpes HPV and other STDs Photos',
            'Light Diseases and Disorders of Pigmentation',
            'Lupus and other Connective Tissue diseases',
            'Melanoma Skin Cancer Nevi and Moles',
            'Nail Fungus and other Nail Disease',
            'Poison Ivy Photos and other Contact Dermatitis',
            'Psoriasis pictures Lichen Planus and related diseases',
            'Scabies Lyme Disease and other Infestations and Bites',
            'Seborrheic Keratoses and other Benign Tumors',
            'Systemic Disease',
            'Tinea Ringworm Candidiasis and other Fungal Infections',
            'Urticaria Hives',
            'Vascular Tumors',
            'Warts Molluscum and other Viral Infections'
        ]
    
    def generate_synthetic_features(self, n_samples=5000):
        """Generate synthetic feature data for training (in absence of real image features)"""
        print("Generating synthetic training data...")
        
        np.random.seed(42)
        
        # Generate features that might be extracted from skin images
        features = []
        labels = []
        
        for class_idx, class_name in enumerate(self.class_names):
            n_class_samples = n_samples // len(self.class_names)
            
            # Generate class-specific feature patterns
            class_features = self._generate_class_features(class_name, n_class_samples)
            features.extend(class_features)
            labels.extend([class_idx] * n_class_samples)
        
        # Convert to numpy arrays
        X = np.array(features)
        y = np.array(labels)
        
        # Feature names
        self.feature_names = [
            'mean_red', 'mean_green', 'mean_blue',
            'std_red', 'std_green', 'std_blue',
            'edge_density', 'texture_contrast', 'texture_homogeneity',
            'area_ratio', 'perimeter_ratio', 'circularity',
            'asymmetry_score', 'border_irregularity', 'color_variation',
            'brightness', 'saturation', 'hue_variance',
            'lesion_size', 'lesion_count', 'surface_texture',
            'inflammation_score', 'scaling_presence', 'pigmentation_level'
        ]
        
        print(f"Generated {X.shape[0]} samples with {X.shape[1]} features")
        return X, y
    
    def _generate_class_features(self, class_name, n_samples):
        """Generate realistic features for each skin condition class"""
        features = []
        
        for _ in range(n_samples):
            # Base features with some randomness
            feature_vector = np.random.normal(0.5, 0.1, 24)
            
            # Adjust features based on condition characteristics
            if 'Acne' in class_name:
                feature_vector[0] += 0.2  # Higher red component
                feature_vector[7] += 0.3  # Higher texture contrast
                feature_vector[21] += 0.4  # Higher inflammation score
                
            elif 'Melanoma' in class_name or 'Cancer' in class_name:
                feature_vector[12] += 0.5  # Higher asymmetry
                feature_vector[13] += 0.4  # Higher border irregularity
                feature_vector[14] += 0.3  # Higher color variation
                feature_vector[18] += 0.3  # Larger lesion size
                
            elif 'Eczema' in class_name or 'Dermatitis' in class_name:
                feature_vector[6] += 0.2   # Higher edge density
                feature_vector[21] += 0.3  # Higher inflammation
                feature_vector[22] += 0.4  # Higher scaling presence
                
            elif 'Psoriasis' in class_name:
                feature_vector[22] += 0.5  # Very high scaling
                feature_vector[20] += 0.3  # Distinct surface texture
                feature_vector[13] -= 0.2  # Well-defined borders (lower irregularity)
                
            elif 'Fungal' in class_name or 'Tinea' in class_name:
                feature_vector[11] += 0.4  # Higher circularity (ring pattern)
                feature_vector[13] += 0.2  # Some border irregularity
                feature_vector[20] += 0.3  # Specific surface texture
                
            elif 'Warts' in class_name or 'Viral' in class_name:
                feature_vector[20] += 0.5  # Very distinct surface texture
                feature_vector[18] -= 0.2  # Smaller lesions typically
                feature_vector[19] += 0.3  # Multiple lesions
                
            # Ensure values are in reasonable range [0, 1]
            feature_vector = np.clip(feature_vector, 0, 1)
            features.append(feature_vector)
        
        return features
    
    def train_models(self, X, y):
        """Train multiple models with hyperparameter optimization"""
        print("Training enhanced models...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Define models with hyperparameter grids
        model_configs = {
            'random_forest': {
                'model': RandomForestClassifier(random_state=42),
                'params': {
                    'n_estimators': [100, 200],
                    'max_depth': [10, 20, None],
                    'min_samples_split': [2, 5],
                    'min_samples_leaf': [1, 2]
                }
            },
            'gradient_boosting': {
                'model': GradientBoostingClassifier(random_state=42),
                'params': {
                    'n_estimators': [100, 200],
                    'learning_rate': [0.05, 0.1, 0.2],
                    'max_depth': [3, 5, 7]
                }
            },
            'svm': {
                'model': SVC(probability=True, random_state=42),
                'params': {
                    'C': [0.1, 1, 10],
                    'kernel': ['rbf', 'poly'],
                    'gamma': ['scale', 'auto']
                }
            }
        }
        
        # Train and optimize each model
        best_models = {}
        results = {}
        
        for name, config in model_configs.items():
            print(f"Training {name}...")
            
            # Grid search for best parameters
            grid_search = GridSearchCV(
                config['model'], 
                config['params'], 
                cv=5, 
                scoring='accuracy',
                n_jobs=-1
            )
            
            # Use scaled data for SVM, original for tree-based models
            X_train_use = X_train_scaled if name == 'svm' else X_train
            X_test_use = X_test_scaled if name == 'svm' else X_test
            
            grid_search.fit(X_train_use, y_train)
            best_model = grid_search.best_estimator_
            
            # Evaluate
            train_score = best_model.score(X_train_use, y_train)
            test_score = best_model.score(X_test_use, y_test)
            cv_scores = cross_val_score(best_model, X_train_use, y_train, cv=5)
            
            best_models[name] = best_model
            results[name] = {
                'best_params': grid_search.best_params_,
                'train_accuracy': train_score,
                'test_accuracy': test_score,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'best_cv_score': grid_search.best_score_
            }
            
            print(f"{name} - Test Accuracy: {test_score:.4f}, CV: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        # Create ensemble model
        print("Creating ensemble model...")
        ensemble = VotingClassifier([
            ('rf', best_models['random_forest']),
            ('gb', best_models['gradient_boosting']),
            ('svm', best_models['svm'])
        ], voting='soft')
        
        # Train ensemble (use original features for ensemble)
        ensemble.fit(X_train, y_train)
        ensemble_score = ensemble.score(X_test, y_test)
        
        best_models['ensemble'] = ensemble
        results['ensemble'] = {
            'test_accuracy': ensemble_score,
            'components': ['random_forest', 'gradient_boosting', 'svm']
        }
        
        print(f"Ensemble - Test Accuracy: {ensemble_score:.4f}")
        
        self.models = best_models
        return results, X_test, y_test
    
    def save_models(self, results):
        """Save trained models and metadata"""
        print("Saving models...")
        
        # Save models
        models_to_save = [self.models['random_forest'], self.models['gradient_boosting'], self.models['svm']]
        with open('models/skin_ensemble_models.pkl', 'wb') as f:
            pickle.dump(models_to_save, f)
        
        # Save scaler
        with open('models/skin_scaler.pkl', 'wb') as f:
            pickle.dump(self.scaler, f)
        
        # Save metadata
        metadata = {
            'version': datetime.now().strftime('%Y%m%d_%H%M%S'),
            'training_date': datetime.now().isoformat(),
            'model_type': 'enhanced_skin_ensemble',
            'models': list(self.models.keys()),
            'feature_names': self.feature_names,
            'class_names': self.class_names,
            'num_classes': len(self.class_names),
            'num_features': len(self.feature_names),
            'results': results,
            'enhancements': [
                'Hyperparameter optimization with GridSearchCV',
                'Ensemble voting classifier',
                'Feature scaling for SVM',
                'Cross-validation evaluation',
                'Synthetic feature generation with class-specific patterns'
            ]
        }
        
        with open('models/skin_model_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        
        print("Models saved successfully!")
        return metadata
    
    def evaluate_models(self, X_test, y_test):
        """Detailed evaluation of all models"""
        print("\nDetailed Model Evaluation:")
        print("=" * 50)
        
        for name, model in self.models.items():
            if name == 'ensemble':
                X_test_use = X_test
            elif name == 'svm':
                X_test_use = self.scaler.transform(X_test)
            else:
                X_test_use = X_test
            
            y_pred = model.predict(X_test_use)
            accuracy = accuracy_score(y_test, y_pred)
            
            print(f"\n{name.upper()} Model:")
            print(f"Accuracy: {accuracy:.4f}")
            
            # Show classification report for ensemble
            if name == 'ensemble':
                print("\nClassification Report (Ensemble):")
                class_names_short = [name.split()[0] for name in self.class_names]
                print(classification_report(y_test, y_pred, target_names=class_names_short, zero_division=0))

def main():
    """Main training function"""
    print("Enhanced Skin Disease Model Training")
    print("=" * 40)
    
    # Create models directory if it doesn't exist
    os.makedirs('models', exist_ok=True)
    
    # Initialize trainer
    trainer = EnhancedSkinModelTrainer()
    
    # Generate synthetic training data
    X, y = trainer.generate_synthetic_features(n_samples=10000)
    
    # Train models
    results, X_test, y_test = trainer.train_models(X, y)
    
    # Evaluate models
    trainer.evaluate_models(X_test, y_test)
    
    # Save models
    metadata = trainer.save_models(results)
    
    print(f"\nTraining completed successfully!")
    print(f"Model version: {metadata['version']}")
    print(f"Best model accuracy: {max([r.get('test_accuracy', 0) for r in results.values()]):.4f}")
    
    return metadata

if __name__ == "__main__":
    main()