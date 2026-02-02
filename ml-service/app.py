from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from disease_predictor import DiseasePredictor
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

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ML Disease Predictor',
        'model_loaded': predictor is not None
    })

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