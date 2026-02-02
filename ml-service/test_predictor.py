#!/usr/bin/env python3
"""
Test script for the enhanced DiseasePredictor
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from disease_predictor import DiseasePredictor

def test_predictor():
    print("Testing Enhanced DiseasePredictor...")
    print("=" * 50)
    
    try:
        # Initialize predictor
        print("1. Initializing DiseasePredictor...")
        predictor = DiseasePredictor()
        print("✓ DiseasePredictor initialized successfully")
        
        # Test model summary
        print("\n2. Getting model summary...")
        summary = predictor.get_model_summary()
        print(f"✓ Training samples: {summary['training_samples']}")
        print(f"✓ Testing samples: {summary['testing_samples']}")
        print(f"✓ Features: {summary['num_features']}")
        print(f"✓ Diseases: {summary['num_diseases']}")
        print(f"✓ Models trained: {summary['models_trained']}")
        if 'best_model' in summary:
            print(f"✓ Best model: {summary['best_model']} ({summary['best_model_accuracy']:.1%})")
        
        # Test prediction
        print("\n3. Testing prediction...")
        test_symptoms = {
            'fever': 1,
            'cough': 1,
            'fatigue': 1,
            'headache': 1,
            'muscle_pain': 1
        }
        
        result = predictor.predict(test_symptoms)
        print(f"✓ Predicted condition: {result['predicted_condition']}")
        print(f"✓ Confidence: {result['confidence']:.1%}")
        print(f"✓ Top 3 predictions:")
        for i, pred in enumerate(result['top_predictions'][:3], 1):
            print(f"   {i}. {pred['disease']}: {pred['probability']:.1%}")
        
        # Test symptoms list
        print("\n4. Testing symptoms list...")
        symptoms = predictor.get_all_symptoms()
        print(f"✓ Total symptoms available: {len(symptoms)}")
        print(f"✓ First 5 symptoms: {symptoms[:5]}")
        
        print("\n" + "=" * 50)
        print("✅ All tests passed! Enhanced DiseasePredictor is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_predictor()
    sys.exit(0 if success else 1)