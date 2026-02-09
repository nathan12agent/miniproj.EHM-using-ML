# Requirements Document

## Introduction

This document specifies the requirements for improving the skin disease ML model accuracy by training and deploying a real machine learning model to replace the current mock predictions. The system currently uses mock predictions with 6 varied scenarios for 22 skin conditions. The goal is to achieve 85-95% accuracy using PyTorch or 70-80% accuracy using Scikit-learn, while maintaining backward compatibility with existing API endpoints and UI integration.

## Glossary

- **ML_Service**: The machine learning service component that provides skin disease predictions
- **Disease_Helper**: The UI page in the doctor portal that displays skin disease predictions
- **Skin_Predictor**: The Python module (skin_disease_predictor.py) that handles model loading and predictions
- **Training_Script**: Python scripts that train the ML model (PyTorch or Scikit-learn based)
- **Model_File**: The serialized trained model file stored in the models directory
- **Mock_Mode**: The current prediction mode that returns pre-defined varied results without a real model
- **Real_Model_Mode**: The prediction mode that uses a trained ML model for actual inference
- **HAM10000**: A dataset containing 10,000+ dermatoscopic images of skin lesions
- **DermNet**: A dataset containing 23 classes of skin diseases with thousands of images
- **PyTorch**: A deep learning framework compatible with Python 3.14
- **Scikit-learn**: A machine learning library compatible with Python 3.14
- **API_Endpoint**: REST API routes (/skin/conditions and /skin/predict) used by the frontend
- **Confidence_Score**: A probability value (0-1) indicating model certainty in its prediction
- **Top_5_Predictions**: The five most likely skin conditions ranked by confidence score

## Requirements

### Requirement 1: Model Framework Selection

**User Story:** As a developer, I want to choose between PyTorch and Scikit-learn for model training, so that I can balance accuracy requirements with training time and Python 3.14 compatibility.

#### Acceptance Criteria

1. THE System SHALL support training with PyTorch to achieve 85-95% accuracy
2. THE System SHALL support training with Scikit-learn to achieve 70-80% accuracy
3. THE Training_Script SHALL be compatible with Python 3.14
4. THE System SHALL NOT use TensorFlow unless deployed in a separate Docker container or service with Python 3.9-3.11
5. WHEN a developer selects PyTorch, THE Training_Script SHALL use transfer learning with pre-trained models from timm library

### Requirement 2: Dataset Preparation

**User Story:** As a data scientist, I want to prepare a properly structured dataset with 22 skin disease categories, so that the model can be trained on diverse and representative data.

#### Acceptance Criteria

1. THE System SHALL support HAM10000 dataset for training
2. THE System SHALL support DermNet dataset for training
3. THE Dataset SHALL contain all 22 skin condition classes matching the existing class_names list
4. WHEN organizing the dataset, THE System SHALL structure data in class-specific subdirectories under data/skin_disease/train/
5. THE System SHALL split training data into 80% training and 20% validation if no separate validation set is provided
6. THE System SHALL preprocess images to 256x256 RGB format before training

### Requirement 3: Model Training

**User Story:** As a data scientist, I want to train a model with proper data augmentation and validation, so that the model achieves high accuracy and generalizes well to unseen data.

#### Acceptance Criteria

1. WHEN training with PyTorch, THE Training_Script SHALL apply data augmentation including random crop, horizontal flip, vertical flip, rotation, and color jitter
2. WHEN training with Scikit-learn, THE Training_Script SHALL extract color, texture, and shape features from images
3. THE Training_Script SHALL validate model performance on a held-out validation set during training
4. THE Training_Script SHALL save the best model based on validation accuracy
5. THE Training_Script SHALL generate training metadata including accuracy metrics, training date, and model configuration
6. WHEN training completes, THE System SHALL save model files to the models/ directory
7. THE Training_Script SHALL run for a minimum of 50 epochs for PyTorch or until convergence for Scikit-learn

### Requirement 4: Model Integration

**User Story:** As a developer, I want to integrate the trained model into the existing skin_disease_predictor.py, so that the system uses real predictions instead of mock mode.

#### Acceptance Criteria

1. WHEN a trained model exists, THE Skin_Predictor SHALL load the model file on initialization
2. WHEN the model loads successfully, THE Skin_Predictor SHALL set mock_mode to False
3. WHEN the model fails to load or does not exist, THE Skin_Predictor SHALL fall back to mock_mode
4. THE Skin_Predictor SHALL preprocess input images to match the training preprocessing (256x256 RGB)
5. WHEN making predictions, THE Skin_Predictor SHALL return confidence scores for all predictions
6. THE Skin_Predictor SHALL return the top 5 predictions ranked by confidence score

### Requirement 5: API Compatibility

**User Story:** As a backend developer, I want to maintain backward compatibility with existing API endpoints, so that the frontend continues to work without modifications.

#### Acceptance Criteria

1. THE ML_Service SHALL preserve the /skin/conditions endpoint returning all 22 skin condition classes
2. THE ML_Service SHALL preserve the /skin/predict endpoint accepting image data and patient_info
3. WHEN returning predictions, THE API_Endpoint SHALL include predicted_condition, confidence, confidence_level, and top_predictions fields
4. THE API_Endpoint SHALL include a mock_mode boolean field indicating whether real or mock predictions are used
5. THE API_Endpoint SHALL maintain the same JSON response structure as the current mock implementation
6. THE System SHALL handle base64-encoded image data in the same format as the current implementation

### Requirement 6: UI Integration

**User Story:** As a doctor, I want to see whether the system is using real model predictions or mock mode, so that I can trust the accuracy of the predictions.

#### Acceptance Criteria

1. WHEN the real model is loaded, THE Disease_Helper SHALL display "Real Model" instead of "Mock Mode"
2. WHEN in mock mode, THE Disease_Helper SHALL display a disclaimer indicating mock predictions are being used
3. THE Disease_Helper SHALL display confidence scores as percentages for all top predictions
4. THE Disease_Helper SHALL maintain the existing UI layout and functionality
5. THE System SHALL update the model_info field in API responses to reflect whether real or mock mode is active

### Requirement 7: Model Performance

**User Story:** As a product manager, I want the model to achieve target accuracy levels, so that doctors can rely on the predictions for clinical decision support.

#### Acceptance Criteria

1. WHEN using PyTorch, THE Model_File SHALL achieve 85-95% validation accuracy
2. WHEN using Scikit-learn, THE Model_File SHALL achieve 70-80% validation accuracy
3. THE Skin_Predictor SHALL return predictions within 3 seconds per image
4. THE Model_File SHALL correctly classify all 22 skin condition categories
5. WHEN the model confidence is below 60%, THE System SHALL set confidence_level to "Low"
6. WHEN the model confidence is between 60-75%, THE System SHALL set confidence_level to "Medium"
7. WHEN the model confidence is above 75%, THE System SHALL set confidence_level to "High"

### Requirement 8: Model Monitoring

**User Story:** As a system administrator, I want to monitor model performance and track prediction metrics, so that I can identify when the model needs retraining or improvement.

#### Acceptance Criteria

1. THE Training_Script SHALL save training metadata to a JSON file including accuracy, training date, and model configuration
2. THE Skin_Predictor SHALL log prediction requests including timestamp, predicted condition, and confidence score
3. WHEN the model is loaded, THE System SHALL log model metadata including version, framework, and accuracy metrics
4. THE System SHALL expose model metadata through the API response in the model_info field
5. THE Training_Script SHALL save training history including loss and accuracy for each epoch

### Requirement 9: Error Handling

**User Story:** As a developer, I want robust error handling for model loading and prediction failures, so that the system gracefully degrades to mock mode when issues occur.

#### Acceptance Criteria

1. WHEN the model file is missing, THE Skin_Predictor SHALL fall back to mock_mode and log a warning
2. WHEN model loading fails due to incompatible Python version, THE Skin_Predictor SHALL fall back to mock_mode
3. WHEN image preprocessing fails, THE Skin_Predictor SHALL return an error response with available: true
4. WHEN prediction fails during inference, THE Skin_Predictor SHALL return an error response with details
5. IF the model file is corrupted, THEN THE Skin_Predictor SHALL fall back to mock_mode and log an error
6. THE System SHALL include error messages in API responses to help diagnose issues

### Requirement 10: Deployment Flexibility

**User Story:** As a DevOps engineer, I want flexible deployment options for the ML model, so that I can work around Python version constraints and infrastructure limitations.

#### Acceptance Criteria

1. THE System SHALL support running the ML_Service with Python 3.14 using PyTorch or Scikit-learn
2. THE System SHALL support running the ML_Service in a separate Docker container with Python 3.11 for TensorFlow compatibility
3. THE System SHALL document the deployment process for both Python 3.14 native and Docker-based approaches
4. WHEN using Docker, THE System SHALL expose the ML_Service on a configurable port
5. THE System SHALL provide clear documentation on which Python version is required for each framework option
