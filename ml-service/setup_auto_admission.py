#!/usr/bin/env python3
"""
Setup Script for Auto-Admission System
Generates data and trains all ML models
"""

import os
import sys

def setup_auto_admission():
    """Complete setup for auto-admission system"""
    print("=" * 70)
    print("Auto-Admission System Setup")
    print("=" * 70)
    
    # Step 1: Generate synthetic training data
    print("\n📊 Step 1: Generating synthetic training data...")
    try:
        from generate_synthetic_data import main as generate_data
        generate_data()
        print("✅ Training data generated successfully")
    except Exception as e:
        print(f"❌ Failed to generate training data: {e}")
        return False
    
    # Step 2: Train routing model
    print("\n🤖 Step 2: Training department routing model...")
    try:
        from routing_assigner import get_patient_router
        router = get_patient_router()
        result = router.train_ml_router()
        if result:
            print("✅ Routing model trained successfully")
        else:
            print("⚠️  Routing model training skipped (no training data or already using rule-based)")
    except Exception as e:
        print(f"⚠️  Routing model training failed: {e}")
        print("   Will use rule-based routing as fallback")
    
    # Step 3: Train staff assignment models
    print("\n👨‍⚕️ Step 3: Training staff assignment models...")
    try:
        from staff_assignment import get_staff_assigner
        assigner = get_staff_assigner()
        result = assigner.train_assignment_models()
        if result:
            print("✅ Staff assignment models trained successfully")
        else:
            print("⚠️  Staff assignment training skipped (no training data)")
            print("   Will use rule-based scoring as fallback")
    except Exception as e:
        print(f"⚠️  Staff assignment training failed: {e}")
        print("   Will use rule-based scoring as fallback")
    
    # Step 4: Verify auto-admission service
    print("\n🏥 Step 4: Verifying auto-admission service...")
    try:
        from auto_admission_service import get_auto_admission_service
        service = get_auto_admission_service()
        info = service.get_service_info()
        
        print("✅ Auto-admission service initialized")
        print(f"   - Service: {info['service_name']}")
        print(f"   - Version: {info['version']}")
        print("   - Components:")
        for component, status in info['components'].items():
            status_icon = "✅" if status else "⚠️ "
            print(f"     {status_icon} {component}: {'Available' if status else 'Not Available'}")
    except Exception as e:
        print(f"❌ Auto-admission service verification failed: {e}")
        return False
    
    # Step 5: Run quick test
    print("\n🧪 Step 5: Running quick test...")
    try:
        test_data = {
            'patient_info': {
                'name': 'Setup Test Patient',
                'age': 40,
                'gender': 'Male'
            },
            'prediction_type': 'symptoms',
            'symptoms': {
                'chest_pain': 1,
                'breathing_difficulty': 1,
                'fever': 0
            }
        }
        
        result = service.auto_admit_patient(test_data)
        
        if result['success']:
            print("✅ Test admission successful")
            summary = result['admission_summary']
            print(f"   - Disease: {summary['predicted_disease']}")
            print(f"   - Department: {summary['department']}")
            print(f"   - Doctor: {summary['assigned_doctor']['name'] if summary['assigned_doctor'] else 'N/A'}")
            print(f"   - Nurse: {summary['assigned_nurse']['name'] if summary['assigned_nurse'] else 'N/A'}")
        else:
            print(f"⚠️  Test admission failed: {result.get('error')}")
    except Exception as e:
        print(f"⚠️  Test failed: {e}")
    
    # Summary
    print("\n" + "=" * 70)
    print("Setup Complete!")
    print("=" * 70)
    print("\n📝 Next Steps:")
    print("1. Start ML service: python app.py")
    print("2. Test API: python test_auto_admission.py")
    print("3. Integrate with frontend using admin_dashboard_snippet.html")
    print("\n📚 Documentation:")
    print("- AUTO_ADMISSION_SYSTEM_GUIDE.md - Complete system guide")
    print("- ML_LEARNING_OBJECTIVES_COVERAGE.md - Educational value explanation")
    print("\n🌐 API Endpoints:")
    print("- POST /auto_admit_and_assign - Complete admission workflow")
    print("- GET /auto_admission/info - Service information")
    print("\n✨ System is ready to use!")
    
    return True

def main():
    """Main entry point"""
    print("\n🚀 Starting Auto-Admission System Setup...\n")
    
    # Check if we're in the right directory
    if not os.path.exists('data'):
        print("Creating data directory...")
        os.makedirs('data', exist_ok=True)
    
    if not os.path.exists('models'):
        print("Creating models directory...")
        os.makedirs('models', exist_ok=True)
    
    # Run setup
    success = setup_auto_admission()
    
    if success:
        print("\n✅ Setup completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Setup encountered errors. Please check the output above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
