# Implementation Plan: ML Model Accuracy Improvement

## Overview

This implementation plan converts the design for improving ML model accuracy into actionable coding tasks. The plan follows an incremental approach: first preparing the dataset and training infrastructure, then training models (PyTorch and Scikit-learn), integrating the trained models into the predictor, updating the API, and finally adding monitoring and testing.

Each task builds on previous work and includes specific requirements references for traceability. Testing tasks are marked as optional with `*` to allow for faster MVP delivery.

## Tasks

- [x] 1. Prepare dataset infrastructure and validation
  - [x] 1.1 Create dataset directory structure
    - Create `data/skin_disease/train/` directory with 22 subdirectories for each skin condition class
    - Create `data/skin_disease/val/` and `data/skin_disease/test/` directories (optional)
    - Add `.gitkeep` files to preserve directory structure
    - _Requirements: 2.3, 2.4_
  
  - [x] 1.2 Implement dataset validation script
    - Write Python script to validate dataset structure
    - Check that all 22 class directories exist
    - Count images per class and report statistics
    - Verify image formats (jpg, jpeg, png)
    - _Requirements: 2.3, 2.4_
  
  - [ ]* 1.3 Write unit tests for dataset validation
    - Test validation with complete dataset
    - Test validation with missing classes
    - Test validation with invalid image formats
    - _Requirements: 2.3, 2.4_

- [ ] 2. Implement PyTorch training script enhancements
  - [ ] 2.1 Update SkinDiseaseDataset class
    - Ensure dataset loads from directory structure
    - Implement proper error handling for missing images
    - Add support for automatic train/val split (80/20)
    - _Requirements: 2.5, 2.6_
  
  - [ ] 2.2 Update SkinDiseaseModel architecture
    - Verify MobileNetV2 backbone from timm library
    - Ensure custom classifier head matches design
    - Add dropout and batch normalization layers
    - _Requirements: 1.5, 3.1_
  
  - [ ] 2.3 Implement data augmentation pipeline
    - Add RandomCrop, RandomHorizontalFlip, RandomVerticalFlip
    - Add RandomRotation (±30 degrees)
    - Add ColorJitter (brightness, contrast, saturation ±0.2)
    - Add normalization with ImageNet statistics
    - _Requirements: 3.1_
  
  - [ ] 2.4 Implement training loop with validation
    - Add validation after each epoch
    - Implement model checkpointing (save best model)
    - Add learning rate scheduling (ReduceLROnPlateau)
    - Log training and validation metrics
    - _Requirements: 3.3, 3.4, 3.7_
  
  - [ ] 2.5 Implement metadata generation
    - Save training metadata to JSON file
    - Include accuracy, training date, model configuration
    - Include training history (loss and accuracy per epoch)
    - _Requirements: 3.5, 8.1, 8.5_
  
  - [ ]* 2.6 Write property test for data split consistency
    - **Property 1: Data Split Consistency**
    - **Validates: Requirements 2.5**
  
  - [ ]* 2.7 Write property test for model checkpoint selection
    - **Property 3: Model Checkpoint Selection**
    - **Validates: Requirements 3.4**

- [ ] 3. Implement Scikit-learn training script enhancements
  - [ ] 3.1 Update ImageFeatureExtractor class
    - Implement color feature extraction (RGB, HSV, LAB statistics)
    - Implement texture feature extraction (edges, gradients, Laplacian)
    - Implement shape feature extraction (area, perimeter, circularity)
    - Verify total of 40 features per image
    - _Requirements: 3.2_
  
  - [ ] 3.2 Implement model training pipeline
    - Train Random Forest, Gradient Boosting, and SVM
    - Create ensemble voting classifier
    - Implement cross-validation for model selection
    - Save best model based on validation accuracy
    - _Requirements: 3.3, 3.4_
  
  - [ ] 3.3 Implement model and metadata saving
    - Save trained models to pickle files
    - Save scaler and feature extractor
    - Generate metadata JSON with accuracy metrics
    - _Requirements: 3.5, 3.6, 8.1_
  
  - [ ]* 3.4 Write unit tests for feature extraction
    - Test color feature extraction
    - Test texture feature extraction
    - Test shape feature extraction
    - Verify feature count is 40
    - _Requirements: 3.2_

- [ ] 4. Checkpoint - Verify training scripts work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Update SkinDiseasePredictor for model integration
  - [ ] 5.1 Implement multi-model loading logic
    - Check for PyTorch model file first
    - Check for Scikit-learn model files second
    - Fall back to mock mode if no models found
    - Set model_type attribute ('pytorch', 'sklearn', or 'mock')
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 5.2 Implement PyTorch model loading
    - Load model checkpoint from .pth file
    - Initialize SkinDiseaseModel architecture
    - Load state dict and set to eval mode
    - Handle loading errors gracefully
    - _Requirements: 4.1_
  
  - [ ] 5.3 Implement Scikit-learn model loading
    - Load ensemble model from pickle file
    - Load scaler and feature extractor
    - Handle loading errors gracefully
    - _Requirements: 4.1_
  
  - [ ] 5.4 Update image preprocessing for both model types
    - For PyTorch: resize to 256x256, normalize, convert to tensor
    - For Scikit-learn: resize to 256x256, extract features
    - Handle various input formats (base64, file path, PIL Image)
    - _Requirements: 4.4, 5.6_
  
  - [ ] 5.5 Implement prediction logic for PyTorch
    - Preprocess image to tensor
    - Run model inference
    - Extract top 5 predictions with confidence scores
    - Map confidence to confidence_level
    - _Requirements: 4.5, 4.6, 7.5, 7.6, 7.7_
  
  - [ ] 5.6 Implement prediction logic for Scikit-learn
    - Extract features from image
    - Scale features using saved scaler
    - Run ensemble prediction
    - Extract top 5 predictions with confidence scores
    - Map confidence to confidence_level
    - _Requirements: 4.5, 4.6, 7.5, 7.6, 7.7_
  
  - [ ] 5.7 Update predict() method to use real models
    - Check model_type and route to appropriate prediction logic
    - Fall back to mock mode if prediction fails
    - Return response with mock_mode flag
    - _Requirements: 4.2, 4.3_
  
  - [ ]* 5.8 Write property test for model loading and mode selection
    - **Property 4: Model Loading and Mode Selection**
    - **Validates: Requirements 4.1, 4.2, 4.3, 9.1, 9.5**
  
  - [ ]* 5.9 Write property test for image preprocessing uniformity
    - **Property 2: Image Preprocessing Uniformity**
    - **Validates: Requirements 2.6, 4.4**
  
  - [ ]* 5.10 Write property test for prediction confidence scores
    - **Property 5: Prediction Confidence Scores**
    - **Validates: Requirements 4.5**
  
  - [ ]* 5.11 Write property test for top predictions ranking
    - **Property 6: Top Predictions Ranking**
    - **Validates: Requirements 4.6**
  
  - [ ]* 5.12 Write property test for confidence level mapping
    - **Property 9: Confidence Level Mapping**
    - **Validates: Requirements 7.5, 7.6, 7.7**
  
  - [ ]* 5.13 Write property test for base64 image decoding
    - **Property 8: Base64 Image Decoding**
    - **Validates: Requirements 5.6**

- [ ] 6. Implement error handling and logging
  - [ ] 6.1 Add error handling for model loading failures
    - Catch file not found errors
    - Catch import errors (version incompatibility)
    - Catch corrupted file errors
    - Log warnings with details
    - Fall back to mock mode
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [ ] 6.2 Add error handling for prediction failures
    - Catch preprocessing errors
    - Catch inference errors
    - Return error responses with descriptive messages
    - Include 'error' and 'available' fields in response
    - _Requirements: 9.3, 9.4, 9.6_
  
  - [ ] 6.3 Implement prediction logging
    - Log prediction requests with timestamp
    - Log predicted condition and confidence score
    - Log patient_info if provided
    - _Requirements: 8.2_
  
  - [ ] 6.4 Implement model metadata logging
    - Log model metadata on successful load
    - Include version, framework, accuracy metrics
    - _Requirements: 8.3_
  
  - [ ]* 6.5 Write property test for error response structure
    - **Property 10: Error Response Structure**
    - **Validates: Requirements 9.3, 9.4, 9.6**

- [ ] 7. Update Flask API for backward compatibility
  - [ ] 7.1 Verify /skin/conditions endpoint
    - Ensure it returns all 22 skin condition classes
    - Include model_available and mock_mode flags
    - _Requirements: 5.1_
  
  - [ ] 7.2 Verify /skin/predict endpoint
    - Ensure it accepts image data and patient_info
    - Return prediction with all required fields
    - Include mock_mode flag in response
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ] 7.3 Update response structure
    - Ensure predicted_condition, confidence, confidence_level, top_predictions are included
    - Ensure model_info reflects current mode (real or mock)
    - Maintain backward compatibility with existing structure
    - _Requirements: 5.5, 6.5_
  
  - [ ]* 7.4 Write property test for API response completeness
    - **Property 7: API Response Completeness**
    - **Validates: Requirements 5.3, 5.4, 6.5, 8.4**
  
  - [ ]* 7.5 Write integration tests for API endpoints
    - Test /skin/conditions with real model
    - Test /skin/predict with real model
    - Test /skin/predict with mock mode
    - Test error responses for invalid requests
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 8. Checkpoint - Verify API integration works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Update Disease Helper UI integration
  - [ ] 9.1 Update mode indicator display logic
    - Check mock_mode flag in API response
    - Display "Real Model" when mock_mode is false
    - Display "Mock Mode" when mock_mode is true
    - _Requirements: 6.1, 6.2_
  
  - [ ] 9.2 Verify confidence score display
    - Ensure confidence scores are displayed as percentages
    - Display all top 5 predictions with confidence
    - _Requirements: 6.3_
  
  - [ ] 9.3 Add disclaimer for mock mode
    - Display disclaimer when mock_mode is true
    - Hide disclaimer when using real model
    - _Requirements: 6.2_
  
  - [ ]* 9.4 Write UI integration tests
    - Test mode indicator updates correctly
    - Test confidence score formatting
    - Test disclaimer visibility
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 10. Add model performance monitoring
  - [ ] 10.1 Implement prediction metrics tracking
    - Track prediction count per condition
    - Track average confidence scores
    - Track prediction latency
    - _Requirements: 8.2_
  
  - [ ] 10.2 Create model metadata endpoint
    - Expose model metadata through API
    - Include version, framework, accuracy, training date
    - _Requirements: 8.4_
  
  - [ ] 10.3 Add performance logging
    - Log prediction latency for each request
    - Log model loading time on startup
    - Alert if latency exceeds 3 seconds
    - _Requirements: 7.3_
  
  - [ ]* 10.4 Write performance tests
    - Test prediction latency < 3 seconds
    - Test model loading time < 10 seconds
    - Test memory usage during prediction
    - _Requirements: 7.3_

- [ ] 11. Create deployment documentation
  - [ ] 11.1 Document PyTorch deployment (Python 3.14)
    - Installation instructions for PyTorch and dependencies
    - Model training instructions
    - Service startup instructions
    - _Requirements: 10.1, 10.5_
  
  - [ ] 11.2 Document Scikit-learn deployment (Python 3.14)
    - Installation instructions for Scikit-learn and dependencies
    - Model training instructions
    - Service startup instructions
    - _Requirements: 10.1, 10.5_
  
  - [ ] 11.3 Document Docker deployment (Python 3.11 for TensorFlow)
    - Create Dockerfile with Python 3.11
    - Document Docker build and run commands
    - Document port configuration
    - _Requirements: 10.2, 10.4_
  
  - [ ] 11.4 Create training guide
    - Document dataset preparation steps
    - Document training script usage
    - Document expected accuracy ranges
    - Include troubleshooting tips
    - _Requirements: 2.1, 2.2, 7.1, 7.2_

- [ ] 12. Final checkpoint - End-to-end validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The implementation maintains backward compatibility throughout
- Training scripts support both PyTorch (85-95% accuracy) and Scikit-learn (70-80% accuracy)
- System gracefully falls back to mock mode if real model unavailable
