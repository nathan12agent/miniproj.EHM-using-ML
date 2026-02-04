#!/usr/bin/env python3
"""
Skin Disease Predictor using MobileNetV2 Model
"""

import os
import numpy as np
from PIL import Image
import base64
import io
import json

class SkinDiseasePredictor:
    def __init__(self):
        self.model = None
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
        self.load_model()
    
    def load_model(self):
        """Load the skin disease classification model"""
        try:
            # Try to import TensorFlow
            import tensorflow as tf
            
            model_path = 'models/skin_disease_mobilenetv2_finetuned.keras'
            if os.path.exists(model_path):
                self.model = tf.keras.models.load_model(model_path)
                print(f"Skin disease model loaded successfully from {model_path}")
                print(f"Model can classify {len(self.class_names)} skin conditions")
            else:
                print(f"Skin disease model not found at {model_path}")
                self.model = None
                
        except ImportError:
            print("TensorFlow not installed. Using mock skin disease prediction.")
            self.model = "mock"  # Use mock mode
        except Exception as e:
            print(f"Error loading skin disease model: {e}")
            print("Using mock skin disease prediction.")
            self.model = "mock"  # Use mock mode
    
    def preprocess_image(self, image_data):
        """Preprocess image for model prediction"""
        try:
            # If image_data is base64 string, decode it
            if isinstance(image_data, str):
                # Remove data URL prefix if present
                if image_data.startswith('data:image'):
                    image_data = image_data.split(',')[1]
                
                # Decode base64
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
            else:
                # Assume it's already a PIL Image or file path
                if isinstance(image_data, str) and os.path.exists(image_data):
                    image = Image.open(image_data)
                else:
                    image = image_data
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to model input size (256x256)
            image = image.resize((256, 256))
            
            # Convert to numpy array and normalize
            image_array = np.array(image) / 255.0
            
            # Add batch dimension
            image_array = np.expand_dims(image_array, axis=0)
            
            return image_array
            
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return None
    
    def predict_mock(self, patient_info=None):
        """Mock prediction for demonstration purposes"""
        # Simulate realistic skin disease predictions
        mock_predictions = [
            {'condition': 'Eczema Photos', 'probability': 0.65, 'confidence_percentage': 65.0},
            {'condition': 'Atopic Dermatitis Photos', 'probability': 0.18, 'confidence_percentage': 18.0},
            {'condition': 'Psoriasis pictures Lichen Planus and related diseases', 'probability': 0.12, 'confidence_percentage': 12.0},
            {'condition': 'Acne and Rosacea Photos', 'probability': 0.03, 'confidence_percentage': 3.0},
            {'condition': 'Seborrheic Keratoses and other Benign Tumors', 'probability': 0.02, 'confidence_percentage': 2.0}
        ]
        
        return {
            'predicted_condition': mock_predictions[0]['condition'],
            'confidence': mock_predictions[0]['probability'],
            'confidence_level': 'Medium',
            'top_predictions': mock_predictions,
            'patient_info': patient_info or {},
            'model_info': {
                'type': 'MobileNetV2 Fine-tuned for Skin Disease Classification (Mock Mode)',
                'classes': len(self.class_names),
                'input_size': '256x256 RGB'
            },
            'available': True,
            'mock_mode': True,
            'disclaimer': 'This is a mock prediction for demonstration. Real TensorFlow model will be loaded when compatible Python version is available.'
        }
    
    def predict(self, image_data, patient_info=None):
        """Predict skin disease from image"""
        if self.model is None:
            return {
                'error': 'Skin disease model not available',
                'available': False
            }
        
        # If in mock mode, return mock prediction
        if self.model == "mock":
            return self.predict_mock(patient_info)
        
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_data)
            if processed_image is None:
                return {
                    'error': 'Failed to process image',
                    'available': True
                }
            
            # Make prediction
            predictions = self.model.predict(processed_image, verbose=0)
            probabilities = predictions[0]
            
            # Get top 5 predictions
            top_indices = np.argsort(probabilities)[-5:][::-1]
            top_predictions = []
            
            for idx in top_indices:
                condition = self.class_names[idx]
                probability = float(probabilities[idx])
                top_predictions.append({
                    'condition': condition,
                    'probability': probability,
                    'confidence_percentage': probability * 100
                })
            
            # Determine confidence level
            max_prob = float(probabilities.max())
            if max_prob > 0.7:
                confidence_level = 'High'
            elif max_prob > 0.4:
                confidence_level = 'Medium'
            else:
                confidence_level = 'Low'
            
            return {
                'predicted_condition': top_predictions[0]['condition'],
                'confidence': max_prob,
                'confidence_level': confidence_level,
                'top_predictions': top_predictions,
                'patient_info': patient_info or {},
                'model_info': {
                    'type': 'MobileNetV2 Fine-tuned for Skin Disease Classification',
                    'classes': len(self.class_names),
                    'input_size': '256x256 RGB'
                },
                'available': True,
                'mock_mode': False,
                'disclaimer': 'This AI prediction is for educational purposes only and should not replace professional medical diagnosis.'
            }
            
        except Exception as e:
            return {
                'error': f'Prediction failed: {str(e)}',
                'available': True
            }
    
    def get_supported_conditions(self):
        """Get list of all supported skin conditions"""
        return {
            'conditions': self.class_names,
            'total_count': len(self.class_names),
            'model_available': self.model is not None,
            'mock_mode': self.model == "mock"
        }
    
    def is_available(self):
        """Check if skin disease prediction is available"""
        return self.model is not None

# Global instance
skin_predictor = None

def get_skin_predictor():
    """Get or create skin disease predictor instance"""
    global skin_predictor
    if skin_predictor is None:
        skin_predictor = SkinDiseasePredictor()
    return skin_predictor