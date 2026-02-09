from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from disease_predictor_enhanced import DiseasePredictor
from skin_disease_predictor import get_skin_predictor
from staff_ml_routes import register_staff_routes
from auto_admission_service import get_auto_admission_service
from specialist_recommender import get_specialist_recommender
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the disease predictor
try:
    predictor = DiseasePredictor()
    print("Disease predictor initialized successfully")
except Exception as e:
    print(f"Error initializing predictor: {e}")
    predictor = None

# Initialize skin disease predictor
try:
    skin_predictor = get_skin_predictor()
    print("Skin disease predictor initialized successfully")
except Exception as e:
    print(f"Error initializing skin predictor: {e}")
    skin_predictor = None

# Register staff management ML routes
try:
    register_staff_routes(app)
    print("Staff management ML routes registered successfully")
except Exception as e:
    print(f"Error registering staff routes: {e}")

# Initialize auto-admission service
try:
    auto_admission_service = get_auto_admission_service()
    print("Auto-admission service initialized successfully")
except Exception as e:
    print(f"Error initializing auto-admission service: {e}")
    auto_admission_service = None

# Initialize specialist recommender
try:
    specialist_recommender = get_specialist_recommender()
    print("Specialist recommender initialized successfully")
except Exception as e:
    print(f"Error initializing specialist recommender: {e}")
    specialist_recommender = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ML Disease Predictor',
        'model_loaded': predictor is not None,
        'skin_model_loaded': skin_predictor is not None and skin_predictor.is_available()
    })

@app.route('/skin/conditions', methods=['GET'])
def get_skin_conditions():
    """Get list of all supported skin conditions"""
    if not skin_predictor:
        return jsonify({'error': 'Skin disease predictor not available'}), 500
    
    try:
        conditions = skin_predictor.get_supported_conditions()
        return jsonify(conditions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/skin/predict', methods=['POST'])
def predict_skin_disease():
    """Predict skin disease from uploaded image"""
    if not skin_predictor:
        return jsonify({'error': 'Skin disease predictor not available'}), 500
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract image data and patient info
        image_data = data.get('image')
        patient_info = data.get('patient_info', {})
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Make prediction
        prediction_result = skin_predictor.predict(image_data, patient_info)
        
        # Add timestamp
        response = {
            'patient_info': patient_info,
            'prediction': prediction_result,
            'timestamp': pd.Timestamp.now().isoformat(),
            'service_type': 'skin_disease_classification'
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    """Get list of all available symptoms"""
    if not predictor:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        symptoms = predictor.get_all_symptoms()
        # Format symptoms for better display
        formatted_symptoms = [
            {
                'id': symptom,
                'name': symptom.replace('_', ' ').title(),
                'value': symptom
            }
            for symptom in symptoms
        ]
        
        return jsonify({
            'symptoms': formatted_symptoms,
            'total_count': len(formatted_symptoms)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict_disease():
    """Predict disease based on symptoms"""
    if not predictor:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract symptoms from request
        symptoms = data.get('symptoms', {})
        patient_info = data.get('patient_info', {})
        
        if not symptoms:
            return jsonify({'error': 'No symptoms provided'}), 400
        
        # Make prediction
        prediction_result = predictor.predict(symptoms)
        
        # Add patient info to response
        response = {
            'patient_info': patient_info,
            'symptoms_analyzed': [k for k, v in symptoms.items() if v == 1],
            'prediction': prediction_result,
            'timestamp': pd.Timestamp.now().isoformat(),
            'model_info': {
                'type': 'Ensemble (Random Forest, SVM, Gradient Boosting)',
                'features_count': len(predictor.symptom_columns),
                'ensemble_weights': prediction_result.get('ensemble_weights', {}),
                'individual_predictions': prediction_result.get('individual_predictions', {})
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Predict diseases for multiple patients"""
    if not predictor:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.get_json()
        patients = data.get('patients', [])
        
        if not patients:
            return jsonify({'error': 'No patients data provided'}), 400
        
        results = []
        for i, patient in enumerate(patients):
            try:
                symptoms = patient.get('symptoms', {})
                patient_info = patient.get('patient_info', {})
                
                if symptoms:
                    prediction = predictor.predict(symptoms)
                    results.append({
                        'patient_index': i,
                        'patient_info': patient_info,
                        'prediction': prediction,
                        'status': 'success'
                    })
                else:
                    results.append({
                        'patient_index': i,
                        'patient_info': patient_info,
                        'error': 'No symptoms provided',
                        'status': 'error'
                    })
            except Exception as e:
                results.append({
                    'patient_index': i,
                    'patient_info': patient.get('patient_info', {}),
                    'error': str(e),
                    'status': 'error'
                })
        
        return jsonify({
            'results': results,
            'total_patients': len(patients),
            'successful_predictions': len([r for r in results if r['status'] == 'success'])
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/model_info', methods=['GET'])
def get_model_info():
    """Get information about the ML model"""
    if not predictor:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        model_summary = predictor.get_model_summary()
        
        return jsonify({
            'model_type': 'Ensemble (Random Forest, SVM, Gradient Boosting)',
            'total_symptoms': model_summary['num_features'],
            'symptoms': predictor.symptom_columns,
            'model_loaded': True,
            'training_data': f"Training.csv ({model_summary['training_samples']} samples)",
            'testing_data': f"Testing.csv ({model_summary['testing_samples']} samples)",
            'validation_data': f"Validation split ({model_summary.get('validation_samples', 'N/A')} samples)",
            'models_trained': model_summary['models_trained'],
            'best_model': model_summary.get('best_model', 'N/A'),
            'best_model_accuracy': f"{model_summary.get('best_model_accuracy', 0):.1%}",
            'ensemble_performance': model_summary.get('ensemble_performance', {}),
            'num_diseases': model_summary['num_diseases'],
            'last_trained': 'Dynamic (on startup)',
            'version': '2.0.0 - Enhanced Training'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/model_performance', methods=['GET'])
def get_model_performance():
    """Get detailed model performance metrics"""
    if not predictor:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        model_summary = predictor.get_model_summary()
        
        return jsonify({
            'dataset_info': {
                'training_samples': model_summary['training_samples'],
                'testing_samples': model_summary['testing_samples'],
                'validation_samples': model_summary.get('validation_samples', 'N/A'),
                'num_features': model_summary['num_features'],
                'num_diseases': model_summary['num_diseases']
            },
            'model_performance': model_summary.get('ensemble_performance', {}),
            'best_model': {
                'name': model_summary.get('best_model', 'N/A'),
                'accuracy': model_summary.get('best_model_accuracy', 0)
            },
            'models_available': model_summary['models_trained'],
            'status': model_summary.get('status', 'Ready')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auto_admit_and_assign', methods=['POST'])
def auto_admit_and_assign():
    """
    Complete auto-admission workflow
    Predicts disease → Routes to department → Assigns staff
    """
    if not auto_admission_service:
        return jsonify({'error': 'Auto-admission service not available'}), 500
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        prediction_type = data.get('prediction_type', 'symptoms')
        
        if prediction_type == 'symptoms' and not data.get('symptoms'):
            return jsonify({'error': 'Symptoms required for symptom-based prediction'}), 400
        
        if prediction_type == 'image' and not data.get('image'):
            return jsonify({'error': 'Image data required for image-based prediction'}), 400
        
        # Run auto-admission workflow
        result = auto_admission_service.auto_admit_patient(data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auto_admission/info', methods=['GET'])
def get_auto_admission_info():
    """Get information about auto-admission service"""
    if not auto_admission_service:
        return jsonify({'error': 'Auto-admission service not available'}), 500
    
    try:
        info = auto_admission_service.get_service_info()
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/recommend_specialist', methods=['POST'])
def recommend_specialist():
    """
    Recommend specialist based on symptoms or disease
    
    Accepts:
    - {"symptoms": [0,1,0,...]} - Binary symptom array
    - {"symptoms": {"fever": 1, "cough": 1}} - Symptom dict
    - {"disease": "Heart Disease"} - Direct disease name
    
    Returns:
    - specialist: Recommended specialist
    - disease: Predicted or provided disease
    - confidence: Prediction confidence
    - reasoning: Explanation
    """
    if not specialist_recommender:
        return jsonify({'error': 'Specialist recommender not available'}), 500
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get recommendation
        result = specialist_recommender.recommend_specialist(data)
        
        # Add timestamp
        result['timestamp'] = pd.Timestamp.now().isoformat()
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/specialists', methods=['GET'])
def get_specialists():
    """Get list of all available specialists"""
    if not specialist_recommender:
        return jsonify({'error': 'Specialist recommender not available'}), 500
    
    try:
        specialists = specialist_recommender.get_all_specialists()
        return jsonify({
            'specialists': specialists,
            'total_count': len(specialists)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/specialists/<specialist>/diseases', methods=['GET'])
def get_diseases_by_specialist(specialist):
    """Get all diseases treated by a specific specialist"""
    if not specialist_recommender:
        return jsonify({'error': 'Specialist recommender not available'}), 500
    
    try:
        diseases = specialist_recommender.get_diseases_by_specialist(specialist)
        return jsonify({
            'specialist': specialist,
            'diseases': diseases,
            'total_count': len(diseases)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    print(f"Starting ML Service on port {port}")
    print(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)