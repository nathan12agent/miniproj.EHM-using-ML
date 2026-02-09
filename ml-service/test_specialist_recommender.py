#!/usr/bin/env python3
"""
Test Specialist Recommender
Quick tests for specialist recommendation system
"""

import requests
import json

def test_direct_disease():
    """Test with direct disease input"""
    print("\n" + "="*60)
    print("Test 1: Direct Disease Input")
    print("="*60)
    
    data = {
        "disease": "Heart Disease"
    }
    
    response = requests.post('http://localhost:5001/recommend_specialist', json=data)
    result = response.json()
    
    print(f"Disease: {result.get('disease')}")
    print(f"Specialist: {result.get('specialist')}")
    print(f"Confidence: {result.get('confidence', 0):.1%}")
    print(f"Reasoning: {result.get('reasoning')}")

def test_symptom_based():
    """Test with symptom input"""
    print("\n" + "="*60)
    print("Test 2: Symptom-Based Prediction")
    print("="*60)
    
    data = {
        "symptoms": {
            "itching": 1,
            "skin_rash": 1,
            "nodal_skin_eruptions": 1,
            "dischromic_patches": 1
        }
    }
    
    response = requests.post('http://localhost:5001/recommend_specialist', json=data)
    result = response.json()
    
    print(f"Predicted Disease: {result.get('disease')}")
    print(f"Specialist: {result.get('specialist')}")
    print(f"Confidence: {result.get('confidence', 0):.1%}")
    print(f"Method: {result.get('method')}")
    print(f"Reasoning: {result.get('reasoning')}")
    
    if result.get('top_predictions'):
        print("\nTop Predictions:")
        for pred in result['top_predictions'][:3]:
            print(f"  - {pred['disease']}: {pred['probability']:.1%}")

def test_low_confidence():
    """Test low confidence fallback"""
    print("\n" + "="*60)
    print("Test 3: Low Confidence Fallback")
    print("="*60)
    
    data = {
        "symptoms": {
            "fever": 1,
            "cough": 1
        }
    }
    
    response = requests.post('http://localhost:5001/recommend_specialist', json=data)
    result = response.json()
    
    print(f"Predicted Disease: {result.get('disease')}")
    print(f"Specialist: {result.get('specialist')}")
    print(f"Confidence: {result.get('confidence', 0):.1%}")
    print(f"Method: {result.get('method')}")
    print(f"Reasoning: {result.get('reasoning')}")

def test_unknown_disease():
    """Test unknown disease fallback"""
    print("\n" + "="*60)
    print("Test 4: Unknown Disease Fallback")
    print("="*60)
    
    data = {
        "disease": "Unknown Rare Disease"
    }
    
    response = requests.post('http://localhost:5001/recommend_specialist', json=data)
    result = response.json()
    
    print(f"Disease: {result.get('disease')}")
    print(f"Specialist: {result.get('specialist')}")
    print(f"Method: {result.get('method')}")
    print(f"Reasoning: {result.get('reasoning')}")

def test_get_specialists():
    """Test getting all specialists"""
    print("\n" + "="*60)
    print("Test 5: Get All Specialists")
    print("="*60)
    
    response = requests.get('http://localhost:5001/specialists')
    result = response.json()
    
    print(f"Total Specialists: {result.get('total_count')}")
    print("\nSpecialists:")
    for specialist in result.get('specialists', []):
        print(f"  - {specialist}")

def main():
    """Run all tests"""
    print("\n🧪 Specialist Recommender Test Suite")
    
    try:
        test_direct_disease()
        test_symptom_based()
        test_low_confidence()
        test_unknown_disease()
        test_get_specialists()
        
        print("\n" + "="*60)
        print("✅ All tests completed!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Cannot connect to ML service")
        print("Make sure Flask app is running: python app.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == '__main__':
    main()
