#!/usr/bin/env python3
"""
Specialist Recommendation Module
Maps diseases to appropriate medical specialists
Supports both direct disease input and symptom-based prediction
"""

import numpy as np
from disease_predictor_enhanced import DiseasePredictor

class SpecialistRecommender:
    def __init__(self):
        # Disease to specialist mapping (comprehensive list with exact matches from ML model)
        self.disease_specialist_map = {
            # Cardiology
            'Heart Disease': 'Cardiologist',
            'heart disease': 'Cardiologist',
            'Hypertension': 'Cardiologist',
            'hypertension': 'Cardiologist',
            'Heart attack': 'Cardiologist',
            'heart attack': 'Cardiologist',
            'Varicose veins': 'Cardiologist',
            'varicose veins': 'Cardiologist',
            
            # Neurology
            'Migraine': 'Neurologist',
            'migraine': 'Neurologist',
            'Paralysis (brain hemorrhage)': 'Neurologist',
            'paralysis (brain hemorrhage)': 'Neurologist',
            'Cervical spondylosis': 'Neurologist',
            'cervical spondylosis': 'Neurologist',
            
            # Gastroenterology
            'Peptic ulcer diseae': 'Gastroenterologist',
            'peptic ulcer diseae': 'Gastroenterologist',
            'Peptic ulcer disease': 'Gastroenterologist',
            'peptic ulcer disease': 'Gastroenterologist',
            'GERD': 'Gastroenterologist',
            'gerd': 'Gastroenterologist',
            'Chronic cholestasis': 'Gastroenterologist',
            'chronic cholestasis': 'Gastroenterologist',
            'Hepatitis A': 'Gastroenterologist',
            'hepatitis a': 'Gastroenterologist',
            'Hepatitis B': 'Gastroenterologist',
            'hepatitis b': 'Gastroenterologist',
            'Hepatitis C': 'Gastroenterologist',
            'hepatitis c': 'Gastroenterologist',
            'Hepatitis D': 'Gastroenterologist',
            'hepatitis d': 'Gastroenterologist',
            'Hepatitis E': 'Gastroenterologist',
            'hepatitis e': 'Gastroenterologist',
            'Alcoholic hepatitis': 'Gastroenterologist',
            'alcoholic hepatitis': 'Gastroenterologist',
            'Jaundice': 'Gastroenterologist',
            'jaundice': 'Gastroenterologist',
            'Gastroenteritis': 'Gastroenterologist',
            'gastroenteritis': 'Gastroenterologist',
            
            # Endocrinology
            'Diabetes': 'Endocrinologist',
            'diabetes': 'Endocrinologist',
            'Diabetes ': 'Endocrinologist',
            'diabetes ': 'Endocrinologist',
            'Hyperthyroidism': 'Endocrinologist',
            'hyperthyroidism': 'Endocrinologist',
            'Hypothyroidism': 'Endocrinologist',
            'hypothyroidism': 'Endocrinologist',
            
            # Dermatology
            'Fungal infection': 'Dermatologist',
            'fungal infection': 'Dermatologist',
            'Acne': 'Dermatologist',
            'acne': 'Dermatologist',
            'Psoriasis': 'Dermatologist',
            'psoriasis': 'Dermatologist',
            'Impetigo': 'Dermatologist',
            'impetigo': 'Dermatologist',
            
            # Pulmonology / Respiratory
            'Pneumonia': 'Pulmonologist',
            'pneumonia': 'Pulmonologist',
            'Bronchial Asthma': 'Pulmonologist',
            'bronchial asthma': 'Pulmonologist',
            'Asthma': 'Pulmonologist',
            'asthma': 'Pulmonologist',
            'Tuberculosis': 'Pulmonologist',
            'tuberculosis': 'Pulmonologist',
            'Common Cold': 'General Practitioner',
            'common cold': 'General Practitioner',
            'Cold': 'General Practitioner',
            'cold': 'General Practitioner',
            
            # Nephrology / Urology
            'Urinary tract infection': 'Nephrologist',
            'urinary tract infection': 'Nephrologist',
            'UTI': 'Nephrologist',
            'uti': 'Nephrologist',
            'Chronic kidney disease': 'Nephrologist',
            'chronic kidney disease': 'Nephrologist',
            
            # Rheumatology
            'Arthritis': 'Rheumatologist',
            'arthritis': 'Rheumatologist',
            'Osteoarthristis': 'Rheumatologist',
            'osteoarthristis': 'Rheumatologist',
            'Osteoarthritis': 'Rheumatologist',
            'osteoarthritis': 'Rheumatologist',
            
            # Orthopedics
            '(vertigo) Paroymsal  Positional Vertigo': 'Orthopedic Surgeon',
            '(vertigo) paroymsal  positional vertigo': 'Orthopedic Surgeon',
            'Vertigo': 'Orthopedic Surgeon',
            'vertigo': 'Orthopedic Surgeon',
            
            # Allergist / Immunologist
            'Drug Reaction': 'Allergist',
            'drug reaction': 'Allergist',
            'Allergy': 'Allergist',
            'allergy': 'Allergist',
            
            # Infectious Disease
            'Malaria': 'Infectious Disease Specialist',
            'malaria': 'Infectious Disease Specialist',
            'Dengue': 'Infectious Disease Specialist',
            'dengue': 'Infectious Disease Specialist',
            'Typhoid': 'Infectious Disease Specialist',
            'typhoid': 'Infectious Disease Specialist',
            'Chicken pox': 'Infectious Disease Specialist',
            'chicken pox': 'Infectious Disease Specialist',
            'Chickenpox': 'Infectious Disease Specialist',
            'chickenpox': 'Infectious Disease Specialist',
            'AIDS': 'Infectious Disease Specialist',
            'aids': 'Infectious Disease Specialist',
            'HIV': 'Infectious Disease Specialist',
            'hiv': 'Infectious Disease Specialist',
            
            # General Surgery
            'Dimorphic hemmorhoids(piles)': 'General Surgeon',
            'dimorphic hemmorhoids(piles)': 'General Surgeon',
            'Hemorrhoids': 'General Surgeon',
            'hemorrhoids': 'General Surgeon',
            'Piles': 'General Surgeon',
            'piles': 'General Surgeon',
        }
        
        # Initialize disease predictor
        try:
            self.predictor = DiseasePredictor()
            print("✅ Disease predictor loaded for specialist recommendation")
        except Exception as e:
            print(f"⚠️  Disease predictor not available: {e}")
            self.predictor = None
    
    def get_specialist_from_disease(self, disease, confidence=1.0):
        """
        Map disease directly to specialist
        
        Args:
            disease: Disease name
            confidence: Prediction confidence (0-1)
        
        Returns:
            dict with specialist, confidence, and reasoning
        """
        # Normalize disease name (lowercase, strip whitespace)
        disease_normalized = disease.strip().lower() if disease else ''
        
        # Check exact match first
        if disease in self.disease_specialist_map:
            specialist = self.disease_specialist_map[disease]
            return {
                'specialist': specialist,
                'disease': disease,
                'confidence': confidence,
                'method': 'direct_mapping',
                'reasoning': f'{disease} is typically treated by a {specialist}'
            }
        
        # Check normalized match
        if disease_normalized in self.disease_specialist_map:
            specialist = self.disease_specialist_map[disease_normalized]
            return {
                'specialist': specialist,
                'disease': disease,
                'confidence': confidence,
                'method': 'direct_mapping',
                'reasoning': f'{disease} is typically treated by a {specialist}'
            }
        
        # Try partial matching (contains)
        for mapped_disease, specialist in self.disease_specialist_map.items():
            if disease_normalized in mapped_disease.lower() or mapped_disease.lower() in disease_normalized:
                return {
                    'specialist': specialist,
                    'disease': disease,
                    'confidence': confidence * 0.9,  # Slightly lower confidence for partial match
                    'method': 'partial_mapping',
                    'reasoning': f'{disease} appears related to {mapped_disease}, typically treated by a {specialist}'
                }
        
        # Fallback to General Practitioner for unknown diseases
        return {
            'specialist': 'General Practitioner',
            'disease': disease,
            'confidence': confidence,
            'method': 'fallback',
            'reasoning': f'Disease "{disease}" not in specialist mapping. General Practitioner recommended for initial consultation and proper diagnosis.'
        }
    
    def get_specialist_from_symptoms(self, symptoms):
        """
        Predict disease from symptoms, then map to specialist
        
        Args:
            symptoms: Either list of binary values [0,1,0,...] or dict {symptom: value}
        
        Returns:
            dict with specialist, disease, confidence, and reasoning
        """
        if not self.predictor:
            return {
                'error': 'Disease predictor not available',
                'specialist': 'General Practitioner',
                'confidence': 0.0,
                'method': 'error_fallback'
            }
        
        try:
            # Handle list input (convert to dict)
            if isinstance(symptoms, list):
                symptom_names = self.predictor.symptom_columns
                if len(symptoms) != len(symptom_names):
                    return {
                        'error': f'Expected {len(symptom_names)} symptoms, got {len(symptoms)}',
                        'specialist': 'General Practitioner',
                        'confidence': 0.0
                    }
                symptoms = {name: val for name, val in zip(symptom_names, symptoms)}
            
            # Predict disease
            prediction = self.predictor.predict(symptoms)
            
            # Extract disease and confidence
            disease = prediction.get('predicted_disease') or prediction.get('disease')
            confidence = prediction.get('confidence', 0.0)
            
            # If disease is None but we have top predictions, use the top one
            if disease is None and prediction.get('top_predictions'):
                top_pred = prediction['top_predictions'][0]
                disease = top_pred.get('disease')
                confidence = top_pred.get('probability', confidence)
            
            # Low confidence fallback
            if confidence < 0.5:
                return {
                    'specialist': 'General Practitioner',
                    'disease': disease,
                    'confidence': confidence,
                    'method': 'low_confidence_fallback',
                    'reasoning': f'Low confidence ({confidence:.1%}). General Practitioner recommended for proper diagnosis.',
                    'alternative_diseases': prediction.get('top_predictions', [])[:3]
                }
            
            # Get specialist from predicted disease
            result = self.get_specialist_from_disease(disease, confidence)
            result['method'] = 'symptom_based_prediction'
            result['top_predictions'] = prediction.get('top_predictions', [])[:3]
            
            return result
            
        except Exception as e:
            return {
                'error': str(e),
                'specialist': 'General Practitioner',
                'confidence': 0.0,
                'method': 'error_fallback'
            }
    
    def recommend_specialist(self, input_data):
        """
        Main recommendation function
        Accepts either symptoms or disease name
        
        Args:
            input_data: dict with either 'symptoms' or 'disease' key
        
        Returns:
            dict with specialist recommendation
        """
        # Case 1: Direct disease input
        if 'disease' in input_data:
            disease = input_data['disease']
            confidence = input_data.get('confidence', 1.0)
            return self.get_specialist_from_disease(disease, confidence)
        
        # Case 2: Symptom-based prediction
        elif 'symptoms' in input_data:
            symptoms = input_data['symptoms']
            return self.get_specialist_from_symptoms(symptoms)
        
        # Invalid input
        else:
            return {
                'error': 'Invalid input. Provide either "disease" or "symptoms"',
                'specialist': 'General Practitioner',
                'confidence': 0.0
            }
    
    def get_all_specialists(self):
        """Get list of all available specialists"""
        specialists = list(set(self.disease_specialist_map.values()))
        specialists.sort()
        return specialists
    
    def get_diseases_by_specialist(self, specialist):
        """Get all diseases treated by a specific specialist"""
        diseases = [disease for disease, spec in self.disease_specialist_map.items() 
                   if spec == specialist]
        return diseases

# Global instance
specialist_recommender = None

def get_specialist_recommender():
    """Get or create specialist recommender instance"""
    global specialist_recommender
    if specialist_recommender is None:
        specialist_recommender = SpecialistRecommender()
    return specialist_recommender
