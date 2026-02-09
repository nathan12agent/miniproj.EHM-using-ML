#!/usr/bin/env python3
"""
Auto-Admission Service
Orchestrates the complete auto-admission workflow:
1. Disease prediction (from symptoms or image)
2. Department routing (rule-based + ML)
3. Staff assignment (ML-based suitability scoring)
"""

from routing_assigner import get_patient_router
from staff_assignment import get_staff_assigner
from disease_predictor_enhanced import DiseasePredictor
from skin_disease_predictor import get_skin_predictor
import pandas as pd
from datetime import datetime

class AutoAdmissionService:
    def __init__(self):
        self.patient_router = get_patient_router()
        self.staff_assigner = get_staff_assigner()
        self.disease_predictor = None
        self.skin_predictor = None
        
        # Initialize disease predictors
        try:
            self.disease_predictor = DiseasePredictor()
            print("✅ Disease predictor initialized")
        except Exception as e:
            print(f"⚠️  Disease predictor initialization failed: {e}")
        
        try:
            self.skin_predictor = get_skin_predictor()
            print("✅ Skin disease predictor initialized")
        except Exception as e:
            print(f"⚠️  Skin disease predictor initialization failed: {e}")
    
    def predict_disease_from_symptoms(self, symptoms):
        """
        Predict disease from symptoms
        
        Args:
            symptoms: Dict of symptom_name: value (0 or 1)
        
        Returns:
            dict with disease, confidence, top_predictions
        """
        if not self.disease_predictor:
            return {
                'success': False,
                'error': 'Disease predictor not available'
            }
        
        try:
            prediction = self.disease_predictor.predict(symptoms)
            
            # Handle different response formats
            disease = prediction.get('predicted_disease') or prediction.get('disease')
            confidence = prediction.get('confidence', 0.0)
            top_predictions = prediction.get('top_predictions', [])
            
            return {
                'success': True,
                'disease': disease,
                'confidence': confidence,
                'top_predictions': top_predictions,
                'prediction_method': 'symptom_based'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def predict_disease_from_image(self, image_data, patient_info=None):
        """
        Predict skin disease from image
        
        Args:
            image_data: Base64 encoded image or image path
            patient_info: Optional patient information
        
        Returns:
            dict with disease, confidence, top_predictions
        """
        if not self.skin_predictor or not self.skin_predictor.is_available():
            return {
                'success': False,
                'error': 'Skin disease predictor not available'
            }
        
        try:
            prediction = self.skin_predictor.predict(image_data, patient_info)
            
            # Handle different response formats
            disease = prediction.get('predicted_condition') or prediction.get('disease')
            confidence = prediction.get('confidence', 0.0)
            top_predictions = prediction.get('top_predictions', [])
            
            return {
                'success': True,
                'disease': disease,
                'confidence': confidence,
                'top_predictions': top_predictions,
                'prediction_method': 'image_based'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def route_patient(self, disease, confidence, top_predictions=None):
        """
        Route patient to appropriate department
        
        Args:
            disease: Predicted disease name
            confidence: Prediction confidence (0-1)
            top_predictions: List of (disease, probability) tuples
        
        Returns:
            dict with department, specialist_type, urgency_level, routing_method
        """
        try:
            routing = self.patient_router.route_patient(disease, confidence, top_predictions)
            return {
                'success': True,
                **routing
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def assign_staff(self, department, specialist_type, urgency_level, required_expertise=None):
        """
        Assign doctor and nurse based on ML suitability scoring
        
        Args:
            department: Department name
            specialist_type: Required specialist type
            urgency_level: Urgency level (low, medium, high, critical)
            required_expertise: Optional specific expertise required
        
        Returns:
            dict with assigned doctor and nurse
        """
        try:
            # Assign doctor
            doctor_assignment = self.staff_assigner.assign_doctor(
                department, specialist_type, urgency_level, required_expertise
            )
            
            # Assign nurse
            nurse_assignment = self.staff_assigner.assign_nurse(
                department, urgency_level, required_expertise
            )
            
            return {
                'success': True,
                'doctor_assignment': doctor_assignment,
                'nurse_assignment': nurse_assignment
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def auto_admit_patient(self, patient_data):
        """
        Complete auto-admission workflow
        
        Args:
            patient_data: Dict containing:
                - patient_info: Patient details (name, age, etc.)
                - symptoms: Dict of symptoms (for symptom-based prediction)
                - image: Image data (for image-based prediction)
                - prediction_type: 'symptoms' or 'image'
        
        Returns:
            Complete admission result with disease, routing, and staff assignments
        """
        result = {
            'timestamp': datetime.now().isoformat(),
            'patient_info': patient_data.get('patient_info', {}),
            'workflow_steps': []
        }
        
        # Step 1: Disease Prediction
        prediction_type = patient_data.get('prediction_type', 'symptoms')
        
        if prediction_type == 'symptoms':
            symptoms = patient_data.get('symptoms', {})
            disease_result = self.predict_disease_from_symptoms(symptoms)
        elif prediction_type == 'image':
            image_data = patient_data.get('image')
            disease_result = self.predict_disease_from_image(
                image_data, 
                patient_data.get('patient_info')
            )
        else:
            return {
                **result,
                'success': False,
                'error': 'Invalid prediction_type. Must be "symptoms" or "image"'
            }
        
        result['workflow_steps'].append({
            'step': 1,
            'name': 'Disease Prediction',
            'result': disease_result
        })
        
        if not disease_result['success']:
            result['success'] = False
            result['error'] = disease_result.get('error', 'Disease prediction failed')
            return result
        
        # Step 2: Department Routing
        routing_result = self.route_patient(
            disease_result['disease'],
            disease_result['confidence'],
            disease_result.get('top_predictions')
        )
        
        result['workflow_steps'].append({
            'step': 2,
            'name': 'Department Routing',
            'result': routing_result
        })
        
        if not routing_result['success']:
            result['success'] = False
            result['error'] = routing_result.get('error', 'Routing failed')
            return result
        
        # Step 3: Staff Assignment
        staff_result = self.assign_staff(
            routing_result['department'],
            routing_result['specialist_type'],
            routing_result['urgency_level'],
            disease_result['disease']
        )
        
        result['workflow_steps'].append({
            'step': 3,
            'name': 'Staff Assignment',
            'result': staff_result
        })
        
        if not staff_result['success']:
            result['success'] = False
            result['error'] = staff_result.get('error', 'Staff assignment failed')
            return result
        
        # Compile final result
        result['success'] = True
        result['admission_summary'] = {
            'predicted_disease': disease_result['disease'],
            'confidence': disease_result['confidence'],
            'department': routing_result['department'],
            'specialist_type': routing_result['specialist_type'],
            'urgency_level': routing_result['urgency_level'],
            'assigned_doctor': staff_result['doctor_assignment'].get('assigned_doctor'),
            'assigned_nurse': staff_result['nurse_assignment'].get('assigned_nurse'),
            'requires_triage': routing_result.get('requires_triage', False),
            'routing_method': routing_result.get('routing_method'),
            'assignment_method': 'ml_suitability_scoring'
        }
        
        return result
    
    def get_service_info(self):
        """Get information about the auto-admission service"""
        return {
            'service_name': 'Auto-Admission Service',
            'version': '1.0.0',
            'components': {
                'disease_predictor': self.disease_predictor is not None,
                'skin_predictor': self.skin_predictor is not None and self.skin_predictor.is_available(),
                'patient_router': self.patient_router is not None,
                'staff_assigner': self.staff_assigner is not None
            },
            'supported_prediction_types': ['symptoms', 'image'],
            'workflow_steps': [
                '1. Disease Prediction (Symptom-based or Image-based)',
                '2. Department Routing (Rule-based + ML)',
                '3. Staff Assignment (ML Suitability Scoring)'
            ],
            'ml_models_used': [
                'Ensemble Disease Classifier (Random Forest, SVM, Gradient Boosting)',
                'Skin Disease CNN (if available)',
                'Department Router (Logistic Regression, Decision Tree, SVM, Random Forest)',
                'Staff Assignment (Random Forest Regressor)'
            ]
        }

# Global instance
auto_admission_service = None

def get_auto_admission_service():
    """Get or create auto-admission service instance"""
    global auto_admission_service
    if auto_admission_service is None:
        auto_admission_service = AutoAdmissionService()
    return auto_admission_service
