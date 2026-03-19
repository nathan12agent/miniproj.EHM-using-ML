# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import time
from functools import lru_cache
import hashlib
import json

app = Flask(__name__)
CORS(app)

# ============================================
# OPTIMIZATION 1: Lazy Loading
# Load models only when needed, not on startup
# ============================================
_predictor = None
_skin_predictor = None
_auto_admission_service = None
_specialist_recommender = None
_fraud_detector = None

def get_predictor():
    """Lazy load disease predictor"""
    global _predictor
    if _predictor is None:
        try:
            from disease_predictor_enhanced import DiseasePredictor
            _predictor = DiseasePredictor()
            print("✅ Disease predictor loaded")
        except Exception as e:
            print(f"❌ Error loading disease predictor: {e}")
            _predictor = False  # Mark as failed
    return _predictor if _predictor is not False else None

def get_skin_predictor():
    """Lazy load skin disease predictor"""
    global _skin_predictor
    if _skin_predictor is None:
        try:
            from skin_disease_predictor import get_skin_predictor as load_skin
            _skin_predictor = load_skin()
            print("✅ Skin disease predictor loaded")
        except Exception as e:
            print(f"❌ Error loading skin predictor: {e}")
            _skin_predictor = False
    return _skin_predictor if _skin_predictor is not False else None

def get_auto_admission():
    """Lazy load auto-admission service"""
    global _auto_admission_service
    if _auto_admission_service is None:
        try:
            from auto_admission_service import get_auto_admission_service
            _auto_admission_service = get_auto_admission_service()
            print("✅ Auto-admission service loaded")
        except Exception as e:
            print(f"❌ Error loading auto-admission service: {e}")
            _auto_admission_service = False
    return _auto_admission_service if _auto_admission_service is not False else None

def get_specialist():
    """Lazy load specialist recommender"""
    global _specialist_recommender
    if _specialist_recommender is None:
        try:
            from specialist_recommender import get_specialist_recommender
            _specialist_recommender = get_specialist_recommender()
            print("✅ Specialist recommender loaded")
        except Exception as e:
            print(f"❌ Error loading specialist recommender: {e}")
            _specialist_recommender = False
    return _specialist_recommender if _specialist_recommender is not False else None

def get_fraud_detector():
    """Lazy load insurance fraud detector"""
    global _fraud_detector
    if _fraud_detector is None:
        try:
            from insurance_fraud_detector import get_fraud_detector as load_detector
            _fraud_detector = load_detector()
            print("✅ Insurance fraud detector loaded")
        except Exception as e:
            print(f"❌ Error loading fraud detector: {e}")
            _fraud_detector = False
    return _fraud_detector if _fraud_detector is not False else None

# ============================================
# OPTIMIZATION 2: Simple prediction cache
# Cache predictions for 5 minutes
# ============================================
prediction_cache = {}
CACHE_TTL = 300  # 5 minutes

def get_cache_key(data):
    """Generate cache key from request data"""
    return hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()

def get_cached_prediction(cache_key):
    """Get prediction from cache if available and not expired"""
    if cache_key in prediction_cache:
        cached_data, timestamp = prediction_cache[cache_key]
        if time.time() - timestamp < CACHE_TTL:
            return cached_data
        else:
            del prediction_cache[cache_key]
    return None

def cache_prediction(cache_key, data):
    """Cache prediction result"""
    prediction_cache[cache_key] = (data, time.time())
    
    # Clean old cache entries (keep max 100)
    if len(prediction_cache) > 100:
        oldest_key = min(prediction_cache.keys(), 
                        key=lambda k: prediction_cache[k][1])
        del prediction_cache[oldest_key]

# ============================================
# OPTIMIZATION 3: Register staff routes with error handling
# ============================================
try:
    from staff_ml_routes import register_staff_routes
    register_staff_routes(app)
    print("✅ Staff management ML routes registered")
except Exception as e:
    print(f"⚠️  Staff routes not available: {e}")

# ============================================
# ROUTES
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    """Enhanced health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ML Disease Predictor',
        'version': '2.0.0-optimized',
        'models': {
            'disease_predictor': _predictor is not None and _predictor is not False,
            'skin_predictor': _skin_predictor is not None and _skin_predictor is not False,
            'auto_admission': _auto_admission_service is not None and _auto_admission_service is not False,
            'specialist_recommender': _specialist_recommender is not None and _specialist_recommender is not False
        },
        'cache': {
            'size': len(prediction_cache),
            'ttl_seconds': CACHE_TTL
        },
        'timestamp': pd.Timestamp.now().isoformat()
    })

@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    """Get list of all available symptoms"""
    predictor = get_predictor()
    if not predictor:
        return jsonify({'error': 'Disease predictor not available'}), 503
    
    try:
        symptoms = predictor.get_all_symptoms()
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
    """Predict disease based on symptoms with caching"""
    predictor = get_predictor()
    if not predictor:
        return jsonify({'error': 'Disease predictor not available'}), 503
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        symptoms = data.get('symptoms', {})
        if not symptoms:
            return jsonify({'error': 'No symptoms provided'}), 400
        
        # Check cache
        cache_key = get_cache_key({'symptoms': symptoms})
        cached_result = get_cached_prediction(cache_key)
        
        if cached_result:
            cached_result['cached'] = True
            return jsonify(cached_result)
        
        # Make prediction
        prediction_result = predictor.predict(symptoms)
        
        # Build response
        response = {
            'patient_info': data.get('patient_info', {}),
            'symptoms_analyzed': [k for k, v in symptoms.items() if v == 1],
            'prediction': prediction_result,
            'timestamp': pd.Timestamp.now().isoformat(),
            'cached': False,
            'model_info': {
                'type': 'Ensemble (Random Forest, SVM, Gradient Boosting)',
                'features_count': len(predictor.symptom_columns)
            }
        }
        
        # Cache result
        cache_prediction(cache_key, response)
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Predict diseases for multiple patients"""
    predictor = get_predictor()
    if not predictor:
        return jsonify({'error': 'Disease predictor not available'}), 503
    
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
                    # Check cache for each patient
                    cache_key = get_cache_key({'symptoms': symptoms})
                    cached_result = get_cached_prediction(cache_key)
                    
                    if cached_result:
                        prediction = cached_result['prediction']
                    else:
                        prediction = predictor.predict(symptoms)
                        cache_prediction(cache_key, {'prediction': prediction})
                    
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
    predictor = get_predictor()
    if not predictor:
        return jsonify({'error': 'Disease predictor not available'}), 503
    
    try:
        model_summary = predictor.get_model_summary()
        
        return jsonify({
            'model_type': 'Ensemble (Random Forest, SVM, Gradient Boosting)',
            'total_symptoms': model_summary['num_features'],
            'symptoms': predictor.symptom_columns,
            'model_loaded': True,
            'training_data': f"Training.csv ({model_summary['training_samples']} samples)",
            'testing_data': f"Testing.csv ({model_summary['testing_samples']} samples)",
            'models_trained': model_summary['models_trained'],
            'best_model': model_summary.get('best_model', 'N/A'),
            'best_model_accuracy': f"{model_summary.get('best_model_accuracy', 0):.1%}",
            'num_diseases': model_summary['num_diseases'],
            'version': '2.0.0 - Optimized'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/skin/conditions', methods=['GET'])
def get_skin_conditions():
    """Get list of all supported skin conditions"""
    skin_predictor = get_skin_predictor()
    if not skin_predictor:
        return jsonify({'error': 'Skin disease predictor not available'}), 503
    
    try:
        conditions = skin_predictor.get_supported_conditions()
        return jsonify(conditions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/skin/predict', methods=['POST'])
def predict_skin_disease():
    """Predict skin disease from uploaded image"""
    skin_predictor = get_skin_predictor()
    if not skin_predictor:
        return jsonify({'error': 'Skin disease predictor not available'}), 503
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        image_data = data.get('image')
        patient_info = data.get('patient_info', {})
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Make prediction
        prediction_result = skin_predictor.predict(image_data, patient_info)
        
        response = {
            'patient_info': patient_info,
            'prediction': prediction_result,
            'timestamp': pd.Timestamp.now().isoformat(),
            'service_type': 'skin_disease_classification'
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/recommend_specialist', methods=['POST'])
def recommend_specialist():
    """Recommend specialist based on symptoms or disease"""
    specialist = get_specialist()
    if not specialist:
        return jsonify({'error': 'Specialist recommender not available'}), 503
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Check cache
        cache_key = get_cache_key(data)
        cached_result = get_cached_prediction(cache_key)
        
        if cached_result:
            cached_result['cached'] = True
            return jsonify(cached_result)
        
        # Get recommendation
        result = specialist.recommend_specialist(data)
        result['timestamp'] = pd.Timestamp.now().isoformat()
        result['cached'] = False
        
        # Cache result
        cache_prediction(cache_key, result)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/specialists', methods=['GET'])
def get_specialists():
    """Get list of all available specialists"""
    specialist = get_specialist()
    if not specialist:
        return jsonify({'error': 'Specialist recommender not available'}), 503
    
    try:
        specialists = specialist.get_all_specialists()
        return jsonify({
            'specialists': specialists,
            'total_count': len(specialists)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auto_admit_and_assign', methods=['POST'])
def auto_admit_and_assign():
    """Complete auto-admission workflow"""
    auto_admission = get_auto_admission()
    if not auto_admission:
        return jsonify({'error': 'Auto-admission service not available'}), 503
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        prediction_type = data.get('prediction_type', 'symptoms')
        
        if prediction_type == 'symptoms' and not data.get('symptoms'):
            return jsonify({'error': 'Symptoms required for symptom-based prediction'}), 400
        
        if prediction_type == 'image' and not data.get('image'):
            return jsonify({'error': 'Image data required for image-based prediction'}), 400
        
        # Run auto-admission workflow
        result = auto_admission.auto_admit_patient(data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auto_admission/info', methods=['GET'])
def get_auto_admission_info():
    """Get information about auto-admission service"""
    auto_admission = get_auto_admission()
    if not auto_admission:
        return jsonify({'error': 'Auto-admission service not available'}), 503
    
    try:
        info = auto_admission.get_service_info()
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/cache/clear', methods=['POST'])
def clear_cache():
    """Clear prediction cache"""
    global prediction_cache
    cache_size = len(prediction_cache)
    prediction_cache = {}
    return jsonify({
        'message': 'Cache cleared',
        'entries_cleared': cache_size
    })

@app.route('/cache/stats', methods=['GET'])
def cache_stats():
    """Get cache statistics"""
    return jsonify({
        'size': len(prediction_cache),
        'ttl_seconds': CACHE_TTL,
        'max_size': 100
    })

@app.route('/insurance/fraud_detect', methods=['POST'])
def insurance_fraud_detect():
    """Detect insurance fraud from claim features"""
    detector = get_fraud_detector()
    if not detector:
        return jsonify({'error': 'Fraud detector not available'}), 503
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required = ['claimAmount', 'amountVsBenchmark', 'claimsLast90Days',
                    'daysSinceLastClaim', 'isDuplicate', 'policyAgeDays',
                    'patientAge', 'coverageUsedPct', 'diagnosisRiskScore']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({'error': f'Missing fields: {missing}'}), 400
        
        result = detector.predict(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/insurance/benchmarks', methods=['GET'])
def insurance_benchmarks():
    """Get diagnosis code benchmarks"""
    detector = get_fraud_detector()
    if not detector:
        return jsonify({'error': 'Fraud detector not available'}), 503
    return jsonify(detector.get_benchmarks())


@app.route('/insurance/model_info', methods=['GET'])
def insurance_model_info():
    """Get fraud detection model info"""
    detector = get_fraud_detector()
    if not detector:
        return jsonify({'error': 'Fraud detector not available'}), 503
    return jsonify(detector.get_model_info())


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    print('\n🤖 Hospital Management System - ML Service')
    print('================================================')
    print(f'   Port: {port}')
    print(f'   Debug: {debug}')
    print(f'   Lazy Loading: Enabled')
    print(f'   Caching: Enabled ({CACHE_TTL}s TTL)')
    print('================================================\n')
    
    app.run(host='0.0.0.0', port=port, debug=debug)
