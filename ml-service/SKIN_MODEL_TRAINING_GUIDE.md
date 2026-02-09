# Skin Disease Model Training Guide

## 🎯 Goal: Achieve High Accuracy (85%+) for Skin Disease Classification

This guide will help you train a high-accuracy skin disease classification model using TensorFlow and transfer learning.

## 📋 Prerequisites

### 1. Python Version
**IMPORTANT**: TensorFlow requires Python 3.9-3.11 (not compatible with 3.14 yet)

```bash
# Check your Python version
python --version

# If you have Python 3.14, install Python 3.11:
# Download from: https://www.python.org/downloads/release/python-3110/
```

### 2. Create Virtual Environment with Python 3.11

```bash
# Windows
py -3.11 -m venv venv_tf
venv_tf\Scripts\activate

# Linux/Mac
python3.11 -m venv venv_tf
source venv_tf/bin/activate
```

### 3. Install Dependencies

```bash
pip install tensorflow==2.13.0
pip install pillow numpy scikit-learn matplotlib
pip install flask flask-cors pandas
```

## 📊 Dataset Preparation

### Option 1: Use HAM10000 Dataset (Recommended)
The HAM10000 dataset contains 10,000+ dermatoscopic images of skin lesions.

```bash
# Download from: https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000
# Or use: https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/DBW86T
```

### Option 2: Use DermNet Dataset
DermNet contains 23 classes of skin diseases with thousands of images.

```bash
# Download from: https://www.kaggle.com/datasets/shubhamgoel27/dermnet
```

### Dataset Structure
Organize your dataset like this:

```
ml-service/
└── data/
    └── skin_disease/
        ├── train/
        │   ├── Acne and Rosacea Photos/
        │   │   ├── image1.jpg
        │   │   ├── image2.jpg
        │   │   └── ...
        │   ├── Eczema Photos/
        │   │   └── ...
        │   ├── Melanoma Skin Cancer Nevi and Moles/
        │   │   └── ...
        │   └── ... (22 classes total)
        ├── val/ (optional - 20% will be split from train if not provided)
        │   └── ... (same structure)
        └── test/ (optional)
            └── ... (same structure)
```

## 🚀 Training the Model

### Step 1: Prepare Data
```bash
cd ml-service

# Create data directory
mkdir -p data/skin_disease/train

# Copy your dataset into the train folder
# Ensure each class has its own subfolder
```

### Step 2: Run Training Script
```bash
# Activate the TensorFlow environment
venv_tf\Scripts\activate  # Windows
# or
source venv_tf/bin/activate  # Linux/Mac

# Run training
python train_skin_disease_tensorflow.py
```

### Step 3: Monitor Training
The script will:
1. **Phase 1**: Train classification head (50 epochs)
   - Expected accuracy: 70-80%
2. **Phase 2**: Fine-tune entire model (30 epochs)
   - Expected accuracy: 85-95%

Training logs will be saved to `logs/` directory. View with TensorBoard:
```bash
tensorboard --logdir=logs
```

## 📈 Expected Results

### With Good Dataset (10,000+ images):
- **Training Accuracy**: 95-98%
- **Validation Accuracy**: 85-92%
- **Test Accuracy**: 85-90%
- **Top-3 Accuracy**: 95-98%

### With Limited Dataset (1,000-5,000 images):
- **Training Accuracy**: 90-95%
- **Validation Accuracy**: 75-85%
- **Test Accuracy**: 75-85%
- **Top-3 Accuracy**: 90-95%

## 🎨 Model Architecture

The training script uses:
- **Base Model**: MobileNetV2 (pre-trained on ImageNet)
- **Custom Head**: 
  - Global Average Pooling
  - Dense(512) + BatchNorm + Dropout(0.3)
  - Dense(256) + Dropout(0.3)
  - Dense(22, softmax)
- **Regularization**: L2, Dropout, Batch Normalization
- **Data Augmentation**: Rotation, Flip, Zoom, Brightness

## 🔧 Improving Accuracy

### 1. More Training Data
- Collect more images per class (aim for 500+ per class)
- Use data augmentation to artificially increase dataset size

### 2. Better Data Quality
- Remove low-quality images
- Ensure proper labeling
- Balance class distribution

### 3. Hyperparameter Tuning
Edit `train_skin_disease_tensorflow.py`:

```python
# Increase image size for better detail
IMG_SIZE = 256  # or 299

# Adjust batch size based on GPU memory
BATCH_SIZE = 16  # smaller = more stable training

# More epochs if not converging
EPOCHS = 100
FINE_TUNE_EPOCHS = 50

# Try different architectures
ARCHITECTURE = 'efficientnet'  # or 'resnet'
```

### 4. Ensemble Models
Train multiple models and combine predictions:
```python
# Train 3 models with different architectures
model1 = train_model(architecture='mobilenetv2')
model2 = train_model(architecture='efficientnet')
model3 = train_model(architecture='resnet')

# Average predictions
final_prediction = (pred1 + pred2 + pred3) / 3
```

### 5. Advanced Techniques
- **Class Weights**: Handle imbalanced datasets
- **Focal Loss**: Focus on hard examples
- **Mixup/Cutmix**: Advanced augmentation
- **Test-Time Augmentation**: Multiple predictions per image

## 📦 Using the Trained Model

### Step 1: Copy Model to Models Directory
```bash
# The trained model is saved as:
# models/skin_disease_mobilenetv2_finetuned.keras

# Verify it exists
ls -la models/skin_disease_mobilenetv2_finetuned.keras
```

### Step 2: Update skin_disease_predictor.py
The predictor will automatically use the real model if TensorFlow is available:

```python
# In skin_disease_predictor.py
try:
    import tensorflow as tf
    model = tf.keras.models.load_model('models/skin_disease_mobilenetv2_finetuned.keras')
    print("✅ Real TensorFlow model loaded!")
except:
    print("⚠️  Using mock predictions")
```

### Step 3: Restart ML Service
```bash
# Stop current service
# Ctrl+C

# Activate TensorFlow environment
venv_tf\Scripts\activate

# Start service
python app.py
```

### Step 4: Test Predictions
```bash
# Test the API
curl -X POST http://localhost:5001/skin/predict \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image", "patient_info": {"name": "Test"}}'
```

## 🐛 Troubleshooting

### Issue: "TensorFlow not installed"
```bash
# Ensure you're in the correct environment
venv_tf\Scripts\activate
pip install tensorflow==2.13.0
```

### Issue: "CUDA/GPU not found"
TensorFlow will work on CPU, but slower. To use GPU:
```bash
# Install CUDA-enabled TensorFlow
pip install tensorflow[and-cuda]==2.13.0
```

### Issue: "Out of memory"
```python
# Reduce batch size in training script
BATCH_SIZE = 8  # or 4
```

### Issue: "Low accuracy (<70%)"
- Check dataset quality and balance
- Increase training epochs
- Try different architecture (EfficientNet)
- Add more data augmentation

## 📊 Monitoring Training

### TensorBoard
```bash
tensorboard --logdir=logs
# Open: http://localhost:6006
```

### Training Metrics to Watch
- **Validation Accuracy**: Should increase steadily
- **Validation Loss**: Should decrease steadily
- **Gap between Train/Val**: Large gap = overfitting

### Signs of Good Training
✅ Val accuracy increases each epoch
✅ Val loss decreases each epoch
✅ Small gap between train and val accuracy (<10%)

### Signs of Problems
❌ Val accuracy plateaus early (<70%)
❌ Val loss increases (overfitting)
❌ Large gap between train/val (>20%)

## 🎯 Production Deployment

### Option 1: Use Python 3.11 Environment
```bash
# Always use the TensorFlow environment
venv_tf\Scripts\activate
python app.py
```

### Option 2: Docker with Python 3.11
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install tensorflow==2.13.0 flask flask-cors pillow numpy
COPY . .
CMD ["python", "app.py"]
```

### Option 3: Separate ML Service
Run ML service on a separate server with Python 3.11:
```bash
# ML Server (Python 3.11)
python app.py --port 5001

# Main Backend (Python 3.14)
node server.js --port 5000
```

## 📈 Performance Benchmarks

### Model Comparison

| Architecture | Accuracy | Speed | Model Size |
|-------------|----------|-------|------------|
| MobileNetV2 | 85-90% | Fast | 14 MB |
| EfficientNetB0 | 88-92% | Medium | 29 MB |
| ResNet50V2 | 87-91% | Slow | 98 MB |

### Recommended: MobileNetV2
- Best balance of accuracy and speed
- Small model size (good for deployment)
- Fast inference (<100ms per image)

## 🔗 Useful Resources

- [TensorFlow Transfer Learning Guide](https://www.tensorflow.org/tutorials/images/transfer_learning)
- [Skin Disease Datasets](https://www.kaggle.com/datasets?search=skin+disease)
- [MobileNetV2 Paper](https://arxiv.org/abs/1801.04381)
- [Data Augmentation Techniques](https://www.tensorflow.org/tutorials/images/data_augmentation)

## 💡 Tips for Best Results

1. **Start Small**: Test with 100 images per class first
2. **Monitor Closely**: Watch TensorBoard during training
3. **Save Checkpoints**: Best model is saved automatically
4. **Test Thoroughly**: Use separate test set for final evaluation
5. **Iterate**: Try different hyperparameters and architectures

## 🎉 Success Criteria

Your model is ready for production when:
- ✅ Test accuracy > 85%
- ✅ Top-3 accuracy > 95%
- ✅ Consistent predictions across similar images
- ✅ Fast inference (<200ms per image)
- ✅ No significant overfitting (train/val gap <10%)

---

**Need Help?** Check the troubleshooting section or review TensorFlow documentation.

**Ready to Deploy?** Follow the production deployment steps above.
