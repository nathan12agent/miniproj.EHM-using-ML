#!/usr/bin/env python3
"""
Skin Disease Classification with Scikit-learn
Simple feature-based approach - Works with Python 3.14!

Installation:
    pip install scikit-learn pillow numpy opencv-python

Usage:
    python train_skin_sklearn.py

Expected Accuracy: 70-80%
Training Time: 10-30 minutes
"""

import os
import json
import numpy as np
from datetime import datetime
from PIL import Image
import pickle

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import cv2

# Import ImageFeatureExtractor from separate module
from image_features import ImageFeatureExtractor


class ImageFeatureExtractor_OLD:
    """Extract features from skin disease images"""
    
    def __init__(self, img_size=224):
        self.img_size = img_size
    
    def extract_color_features(self, image):
        """Extract color-based features"""
        # Convert to different color spaces
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        
        features = []
        
        # RGB statistics
        for channel in range(3):
            features.extend([
                np.mean(image[:,:,channel]),
                np.std(image[:,:,channel]),
                np.median(image[:,:,channel]),
                np.percentile(image[:,:,channel], 25),
                np.percentile(image[:,:,channel], 75)
            ])
        
        # HSV statistics
        for channel in range(3):
            features.extend([
                np.mean(hsv[:,:,channel]),
                np.std(hsv[:,:,channel])
            ])
        
        # LAB statistics
        for channel in range(3):
            features.extend([
                np.mean(lab[:,:,channel]),
                np.std(lab[:,:,channel])
            ])
        
        return features
    
    def extract_texture_features(self, image):
        """Extract texture-based features using GLCM"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        features = []
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 150)
        features.append(np.mean(edges))
        features.append(np.std(edges))
        
        # Gradient features
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        features.append(np.mean(np.abs(grad_x)))
        features.append(np.mean(np.abs(grad_y)))
        features.append(np.std(grad_x))
        features.append(np.std(grad_y))
        
        # Laplacian (texture measure)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        features.append(np.mean(np.abs(laplacian)))
        features.append(np.std(laplacian))
        
        return features
    
    def extract_shape_features(self, image):
        """Extract shape-based features"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Threshold to find lesion
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        features = []
        
        if contours:
            # Largest contour (assumed to be lesion)
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Area and perimeter
            area = cv2.contourArea(largest_contour)
            perimeter = cv2.arcLength(largest_contour, True)
            
            # Circularity
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter ** 2)
            else:
                circularity = 0
            
            # Bounding box
            x, y, w, h = cv2.boundingRect(largest_contour)
            aspect_ratio = w / h if h > 0 else 0
            extent = area / (w * h) if (w * h) > 0 else 0
            
            features.extend([
                area / (self.img_size ** 2),  # Normalized area
                perimeter / (self.img_size * 4),  # Normalized perimeter
                circularity,
                aspect_ratio,
                extent
            ])
        else:
            features.extend([0, 0, 0, 0, 0])
        
        return features
    
    def extract_all_features(self, image_path):
        """Extract all features from an image"""
        # Load and resize image
        image = Image.open(image_path).convert('RGB')
        image = image.resize((self.img_size, self.img_size))
        image_array = np.array(image)
        
        # Extract features
        color_features = self.extract_color_features(image_array)
        texture_features = self.extract_texture_features(image_array)
        shape_features = self.extract_shape_features(image_array)
        
        # Combine all features
        all_features = color_features + texture_features + shape_features
        
        return np.array(all_features)
    
    def extract_all_features_from_array(self, image_array):
        """Extract all features from an image array (for prediction)"""
        # Extract features
        color_features = self.extract_color_features(image_array)
        texture_features = self.extract_texture_features(image_array)
        shape_features = self.extract_shape_features(image_array)
        
        # Combine all features
        all_features = color_features + texture_features + shape_features
        
        return np.array(all_features)


class SkinDiseaseSklearnTrainer:
    """Train skin disease classifier with scikit-learn"""
    
    def __init__(self):
        self.feature_extractor = ImageFeatureExtractor()
        self.scaler = StandardScaler()
        self.models = {}
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
    
    def load_dataset(self, data_dir):
        """Load and extract features from dataset"""
        print("Loading and extracting features from images...")
        
        X = []
        y = []
        class_to_idx = {cls: idx for idx, cls in enumerate(self.class_names)}
        
        for class_name in os.listdir(data_dir):
            class_dir = os.path.join(data_dir, class_name)
            if not os.path.isdir(class_dir):
                continue
            
            if class_name not in class_to_idx:
                print(f"Warning: Unknown class '{class_name}', skipping...")
                continue
            
            class_idx = class_to_idx[class_name]
            print(f"Processing {class_name}...")
            
            for img_name in os.listdir(class_dir):
                if not img_name.lower().endswith(('.png', '.jpg', '.jpeg')):
                    continue
                
                img_path = os.path.join(class_dir, img_name)
                try:
                    features = self.feature_extractor.extract_all_features(img_path)
                    X.append(features)
                    y.append(class_idx)
                except Exception as e:
                    print(f"Error processing {img_path}: {e}")
        
        X = np.array(X)
        y = np.array(y)
        
        print(f"Loaded {len(X)} images with {X.shape[1]} features each")
        return X, y
    
    def train_models(self, X, y):
        """Train multiple models"""
        print("\n" + "=" * 60)
        print("TRAINING MODELS")
        print("=" * 60)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Define models
        models = {
            'random_forest': RandomForestClassifier(
                n_estimators=200, max_depth=20, min_samples_split=5,
                random_state=42, n_jobs=-1
            ),
            'gradient_boosting': GradientBoostingClassifier(
                n_estimators=200, learning_rate=0.1, max_depth=5,
                random_state=42
            ),
            'svm': SVC(
                C=10, kernel='rbf', gamma='scale', probability=True,
                random_state=42
            )
        }
        
        results = {}
        
        # Train each model
        for name, model in models.items():
            print(f"\nTraining {name}...")
            
            # Use scaled data for SVM, original for tree-based
            X_train_use = X_train_scaled if name == 'svm' else X_train
            X_test_use = X_test_scaled if name == 'svm' else X_test
            
            # Train
            model.fit(X_train_use, y_train)
            
            # Evaluate
            train_score = model.score(X_train_use, y_train)
            test_score = model.score(X_test_use, y_test)
            cv_scores = cross_val_score(model, X_train_use, y_train, cv=5)
            
            results[name] = {
                'train_accuracy': float(train_score),
                'test_accuracy': float(test_score),
                'cv_mean': float(cv_scores.mean()),
                'cv_std': float(cv_scores.std())
            }
            
            self.models[name] = model
            
            print(f"  Train Accuracy: {train_score:.4f}")
            print(f"  Test Accuracy: {test_score:.4f}")
            print(f"  CV Score: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        # Create ensemble
        print("\nCreating ensemble model...")
        ensemble = VotingClassifier([
            ('rf', self.models['random_forest']),
            ('gb', self.models['gradient_boosting']),
            ('svm', self.models['svm'])
        ], voting='soft')
        
        ensemble.fit(X_train, y_train)
        ensemble_score = ensemble.score(X_test, y_test)
        
        self.models['ensemble'] = ensemble
        results['ensemble'] = {
            'test_accuracy': float(ensemble_score)
        }
        
        print(f"  Ensemble Test Accuracy: {ensemble_score:.4f}")
        
        # Detailed evaluation
        print("\n" + "=" * 60)
        print("DETAILED EVALUATION")
        print("=" * 60)
        
        y_pred = ensemble.predict(X_test)
        print("\nClassification Report:")
        # Get actual class names present in the data
        unique_classes = sorted(set(y_train) | set(y_test))
        actual_class_names = [self.class_names[i] for i in unique_classes]
        print(classification_report(y_test, y_pred, target_names=actual_class_names, zero_division=0))
        
        return results, X_test, y_test
    
    def save_models(self, results):
        """Save trained models"""
        print("\nSaving models...")
        
        # Save models
        with open('models/skin_sklearn_models.pkl', 'wb') as f:
            pickle.dump(self.models, f)
        
        # Save scaler
        with open('models/skin_sklearn_scaler.pkl', 'wb') as f:
            pickle.dump(self.scaler, f)
        
        # Save feature extractor
        with open('models/skin_feature_extractor.pkl', 'wb') as f:
            pickle.dump(self.feature_extractor, f)
        
        # Save metadata
        metadata = {
            'version': datetime.now().strftime('%Y%m%d_%H%M%S'),
            'training_date': datetime.now().isoformat(),
            'framework': 'Scikit-learn',
            'approach': 'Feature-based classification',
            'num_classes': len(self.class_names),
            'class_names': self.class_names,
            'results': results,
            'features': [
                'Color features (RGB, HSV, LAB)',
                'Texture features (edges, gradients, Laplacian)',
                'Shape features (area, perimeter, circularity)'
            ],
            'models': list(self.models.keys()),
            'enhancements': [
                'Works with Python 3.14',
                'Fast training (minutes vs hours)',
                'Small model size',
                'Interpretable features',
                'Ensemble voting classifier'
            ]
        }
        
        with open('models/skin_sklearn_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("✅ Models saved successfully!")
        return metadata


def main():
    """Main training function"""
    print("=" * 60)
    print("SKIN DISEASE CLASSIFICATION WITH SCIKIT-LEARN")
    print("=" * 60)
    
    TRAIN_DIR = 'data/skin_disease/train'
    
    # Check if data exists
    if not os.path.exists(TRAIN_DIR):
        print(f"❌ Training data not found at: {TRAIN_DIR}")
        print("\nPlease organize your dataset:")
        print("  data/skin_disease/train/")
        print("    ├── Acne and Rosacea Photos/")
        print("    ├── Eczema Photos/")
        print("    └── ...")
        return
    
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    # Initialize trainer
    trainer = SkinDiseaseSklearnTrainer()
    
    # Load dataset
    X, y = trainer.load_dataset(TRAIN_DIR)
    
    # Train models
    results, X_test, y_test = trainer.train_models(X, y)
    
    # Save models
    metadata = trainer.save_models(results)
    
    print("\n" + "=" * 60)
    print("✅ TRAINING COMPLETED!")
    print("=" * 60)
    print(f"Best Accuracy: {max([r.get('test_accuracy', 0) for r in results.values()]):.4f}")
    print("\nModels saved to:")
    print("  - models/skin_sklearn_models.pkl")
    print("  - models/skin_sklearn_scaler.pkl")
    print("  - models/skin_feature_extractor.pkl")
    print("=" * 60)


if __name__ == "__main__":
    main()
