#!/usr/bin/env python3
"""
Test Auto-Admission System
Quick test to verify all components work together
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_components():
    """Test individual components"""
    print("=" * 60)
    print("Testing Auto-Admission System Components")
    print("=" * 60)
    
    # Test 1: Patient Router
    print("\n1. Testing Patient Router...")
    try:
        from routing_assigner import get_patient_router
        router = get_patient_router()
        
        # Test routing
        result = router.route_patient('Heart Disease', 0.85, None)
        print(f"   ✅ Patient Router working")
        print(f"   - Disease: Heart Disease")
        print(f"   - Department: {result['department']}")
        print(f"   - Specialist: {result['specialist_type']}")
        print(f"   - Urgency: {result['urgency_level']}")
    except Exception as e:
        print(f"   ❌ Patient Router failed: {e}")
    
    # Test 2: Staff Assigner
    print("\n2. Testing Staff Assigner...")
    try:
        from staff_assignment import get_staff_assigner
        assigner = get_staff_assigner()
        
        # Test doctor assignment
        result = assigner.assign_doctor('Cardiology', 'Cardiologist', 'high', 'Heart Disease')
        if result['success']:
            print(f"   ✅ Staff Assigner working")
            print(f"   - Assigned Doctor: {result['assigned_doctor']['name']}")
            print(f"   - Suitability Score: {result['assigned_doctor']['suitability_score']:.1f}/100")
        else:
            print(f"   ⚠️  No doctor available: {result['message']}")
    except Exception as e:
        print(f"   ❌ Staff Assigner failed: {e}")
    
    # Test 3: Auto-Admission Service
    print("\n3. Testing Auto-Admission Service...")
    try:
        from auto_admission_service import get_auto_admission_service
        service = get_auto_admission_service()
        
        # Test complete workflow
        patient_data = {
            'patient_info': {
                'name': 'Test Patient',
                'age': 45,
                'gender': 'Male'
            },
            'prediction_type': 'symptoms',
            'symptoms': {
                'chest_pain': 1,
                'breathing_difficulty': 1,
                'fever': 0,
                'cough': 0
            }
        }
        
        result = service.auto_admit_patient(patient_data)
        
        if result['success']:
            print(f"   ✅ Auto-Admission Service working")
            summary = result['admission_summary']
            print(f"   - Predicted Disease: {summary['predicted_disease']}")
            print(f"   - Confidence: {summary['confidence']:.1%}")
            print(f"   - Department: {summary['department']}")
            print(f"   - Assigned Doctor: {summary['assigned_doctor']['name'] if summary['assigned_doctor'] else 'N/A'}")
            print(f"   - Assigned Nurse: {summary['assigned_nurse']['name'] if summary['assigned_nurse'] else 'N/A'}")
        else:
            print(f"   ⚠️  Auto-Admission failed: {result.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"   ❌ Auto-Admission Service failed: {e}")
    
    print("\n" + "=" * 60)
    print("Component Testing Complete")
    print("=" * 60)

def test_api_endpoint():
    """Test API endpoint (requires Flask app running)"""
    print("\n" + "=" * 60)
    print("Testing API Endpoint")
    print("=" * 60)
    
    try:
        import requests
        
        # Test service info endpoint
        print("\n1. Testing /auto_admission/info endpoint...")
        response = requests.get('http://localhost:5001/auto_admission/info', timeout=5)
        
        if response.status_code == 200:
            info = response.json()
            print(f"   ✅ Service Info endpoint working")
            print(f"   - Service: {info['service_name']}")
            print(f"   - Version: {info['version']}")
            print(f"   - Components: {info['components']}")
        else:
            print(f"   ❌ Service Info endpoint failed: {response.status_code}")
        
        # Test auto-admission endpoint
        print("\n2. Testing /auto_admit_and_assign endpoint...")
        data = {
            'patient_info': {
                'name': 'API Test Patient',
                'age': 35,
                'gender': 'Female'
            },
            'prediction_type': 'symptoms',
            'symptoms': {
                'fever': 1,
                'cough': 1,
                'chest_pain': 0,
                'headache': 0
            }
        }
        
        response = requests.post('http://localhost:5001/auto_admit_and_assign', 
                                json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result['success']:
                print(f"   ✅ Auto-Admission endpoint working")
                summary = result['admission_summary']
                print(f"   - Disease: {summary['predicted_disease']}")
                print(f"   - Department: {summary['department']}")
                print(f"   - Doctor: {summary['assigned_doctor']['name'] if summary['assigned_doctor'] else 'N/A'}")
            else:
                print(f"   ⚠️  Admission failed: {result.get('error')}")
        else:
            print(f"   ❌ Auto-Admission endpoint failed: {response.status_code}")
    
    except requests.exceptions.ConnectionError:
        print("   ⚠️  Cannot connect to ML service")
        print("   Make sure Flask app is running: python app.py")
    except Exception as e:
        print(f"   ❌ API test failed: {e}")
    
    print("\n" + "=" * 60)
    print("API Testing Complete")
    print("=" * 60)

def main():
    """Run all tests"""
    print("\n🔬 Auto-Admission System Test Suite\n")
    
    # Test components
    test_components()
    
    # Test API (if service is running)
    print("\n")
    test_api = input("Test API endpoints? (requires Flask app running) [y/N]: ")
    if test_api.lower() == 'y':
        test_api_endpoint()
    
    print("\n✅ Testing complete!\n")

if __name__ == '__main__':
    main()
