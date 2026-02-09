#!/usr/bin/env python3
"""
Quick test of skin disease prediction
"""

import requests
import json

def test_skin_prediction():
    """Test skin prediction with different patient data"""
    print("Testing skin disease prediction...")
    
    base_url = "http://localhost:5001"
    
    # Test with different patient info to see varied results
    test_cases = [
        {
            "name": "John Doe",
            "age": 25,
            "gender": "Male"
        },
        {
            "name": "Jane Smith", 
            "age": 45,
            "gender": "Female"
        },
        {
            "name": "Bob Wilson",
            "age": 60,
            "gender": "Male"
        }
    ]
    
    # Simple 1x1 pixel image
    mock_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA60e6kgAAAABJRU5ErkJggg=="
    
    for i, patient in enumerate(test_cases, 1):
        print(f"\nTest {i}: {patient['name']}")
        
        test_data = {
            "image": mock_image,
            "patient_info": patient
        }
        
        try:
            response = requests.post(f"{base_url}/skin/predict", json=test_data)
            if response.status_code == 200:
                result = response.json()
                prediction = result['prediction']
                print(f"  Predicted: {prediction['predicted_condition']}")
                print(f"  Confidence: {prediction['confidence']:.2f} ({prediction['confidence']*100:.1f}%)")
                print(f"  Level: {prediction['confidence_level']}")
            else:
                print(f"  Error: {response.status_code}")
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    test_skin_prediction()