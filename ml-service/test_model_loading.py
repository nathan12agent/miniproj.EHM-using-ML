#!/usr/bin/env python3
"""Test if the trained model loads correctly"""
from skin_disease_predictor import get_skin_predictor

print("Testing model loading...")
predictor = get_skin_predictor()

print(f"\nModel loaded: {predictor.model is not None}")
print(f"Model type: {predictor.model_type if hasattr(predictor, 'model_type') else 'unknown'}")
print(f"Mock mode: {predictor.model == 'mock'}")
print(f"Available: {predictor.is_available()}")

# Test get_supported_conditions
conditions = predictor.get_supported_conditions()
print(f"\nSupported conditions: {conditions['total_count']}")
print(f"Model available: {conditions['model_available']}")
print(f"Mock mode: {conditions['mock_mode']}")

print("\n✅ Model loading test complete!")
