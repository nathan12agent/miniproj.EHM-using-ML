#!/usr/bin/env python3
"""
Test script for the enhanced ML API
"""

import requests
import json

def test_ml_api():
    base_url = "http://localhost:5001"
    
    print("Testing Enhanced ML API...")
    print("=" * 50)
    
    try:
        # Test health endpoint
        print("1. Testing health endpoint...")
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✓ Health check passed")
            print(f"  Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
        
        # Test model info endpoint
        print("\n2. Testing model info endpoint...")
        response = requests.get(f"{base_url}/model_info")
        if response.status_code == 200:
            data = response.json()
            print("✓ Model info retrieved successfully")
            print(f"  Model type: {data['model_type']}")
            print(f"  Training data: {data['training_data']}")
            print(f"  Testing data: {data['testing_data']}")
            print(f"  Best model: {data['best_model']} ({data['best_model_accuracy']})")
            print(f"  Total symptoms: {data['total_symptoms']}")
        else:
            print(f"❌ Model info failed: {response.status_code}")
            return False
        
        # Test prediction endpoint
        print("\n3. Testing prediction endpoint...")
        test_data = {
            "patient_info": {
                "name": "Test Patient",
                "age": 30,
                "gender": "Male"
            },
            "symptoms": {
                "fever": 1,
                "cough": 1,
                "fatigue": 1,
                "headache": 1,
                "muscle_pain": 1
            }
        }
        
        response = requests.post(f"{base_url}/predict", json=test_data)
        if response.status_code == 200:
            data = response.json()
            print("✓ Prediction successful")
            print(f"  Patient: {data['patient_info']['name']}")
            print(f"  Symptoms analyzed: {len(data['symptoms_analyzed'])}")
            print(f"  Predicted condition: {data['prediction']['predicted_condition']}")
            print(f"  Confidence: {data['prediction']['confidence']:.1%}")
            print(f"  Model type: {data['model_info']['type']}")
            print(f"  Top 3 predictions:")
            for i, pred in enumerate(data['prediction']['top_predictions'][:3], 1):
                print(f"    {i}. {pred['disease']}: {pred['probability']:.1%}")
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            print(f"  Error: {response.text}")
            return False
        
        # Test model performance endpoint
        print("\n4. Testing model performance endpoint...")
        response = requests.get(f"{base_url}/model_performance")
        if response.status_code == 200:
            data = response.json()
            print("✓ Model performance retrieved successfully")
            print(f"  Training samples: {data['dataset_info']['training_samples']}")
            print(f"  Testing samples: {data['dataset_info']['testing_samples']}")
            print(f"  Best model: {data['best_model']['name']} ({data['best_model']['accuracy']:.1%})")
            print(f"  Models available: {data['models_available']}")
        else:
            print(f"❌ Model performance failed: {response.status_code}")
            return False
        
        print("\n" + "=" * 50)
        print("✅ All API tests passed! Enhanced ML service is working correctly.")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to ML service. Make sure it's running on port 5001.")
        return False
    except Exception as e:
        print(f"❌ Error during API testing: {e}")
        return False

if __name__ == "__main__":
    success = test_ml_api()
    exit(0 if success else 1)