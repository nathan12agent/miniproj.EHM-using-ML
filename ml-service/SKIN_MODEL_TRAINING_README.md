# Skin Disease Model Training Guide

## 🎯 Overview

This guide will help you train a real ML model for skin disease classification to replace the current mock predictions. You have two options:

1. **PyTorch** (Recommended) - 85-95% accuracy, works with Python 3.14
2. **Scikit-learn** (Fast) - 70-80% accuracy, 10-30 minute training

## 📋 Current Status

✅ **Completed:**
- Dataset directory structure created (`data/skin_disease/train/`)
- 22 class subdirectories created for all skin conditions
- Dataset validation script ready (`validate_dataset.py`)
- Training scripts ready (`train_skin_disease_pytorch.py`, `train_skin_sklearn.py`)

⏳ **Next Steps:**
1. Download and prepare dataset
2. Choose training approach (PyTorch or Scikit-learn)
3. Train the model
4. Model will automatically be used by the system

## 📦 Step 1: Prepare Dataset

### Option A: Download HAM10000 Dataset (Recommended)

HAM10000 is a large collection of dermatoscopic images of skin lesions.

```bash
# Download from Kaggle
# https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000

# Or use Kaggle API
pip install kaggle
kaggle datasets download -d kmader/skin-cancer-mnist-ham10000
unzip skin-cancer-mnist-ham10000.zip -d data/ham10000
```

### Option B: Download DermNet Dataset

DermNet contains 23 classes of skin diseases with thousands of images.

```bash
# Download from:
# https://www.kaggle.com/datasets/shubhamgoel27/dermnet

kaggle datasets download -d shubhamgoel27/dermnet
unzip dermnet.zip -d data/dermnet
```

### Option C: Use Your Own Images

Organize your images into the class directories:

```
ml-service/data/skin_disease/train/
├── Acne and Rosacea Photos/
│   ├── image001.jpg
│   ├── image002.jpg
│   └── ...
├── Eczema Photos/
│   └── ...
└── ... (22 classes total)
```

### Validate Dataset

After organizing images, run the validation script:

```bash
cd ml-service
python validate_dataset.py
```

This will show you:
- Total images per class
- Missing classes
- Invalid file formats
- Recommendations

## 🚀 Step 2: Choose Training Approach

### Option 1: PyTorch (Recommended) ⭐

**Best for:** High accuracy with Python 3.14 compatibility

**Pros:**
- 85-95% accuracy
- Works with Python 3.14
- Transfer learning with pre-trained models
- Better for production use

**Cons:**
- Longer training time (6-10 hours)
- Requires more computational resources

**Installation:**
```bash
pip install torch torchvision timm pillow
```

**Training:**
```bash
cd ml-service
python train_skin_disease_pytorch.py
```

**Expected Output:**
- Training will run for 50 epochs
- Best model saved to `models/skin_disease_pytorch_best.pth`
- Metadata saved to `models/skin_pytorch_metadata.json`
- Expected accuracy: 85-95%

### Option 2: Scikit-learn (Fast) ⚡

**Best for:** Quick results and testing

**Pros:**
- Fast training (10-30 minutes)
- Works with Python 3.14
- Small model size
- Easy to understand

**Cons:**
- Lower accuracy (70-80%)
- Feature-based approach

**Installation:**
```bash
pip install scikit-learn opencv-python pillow numpy
```

**Training:**
```bash
cd ml-service
python train_skin_sklearn.py
```

**Expected Output:**
- Training completes in 10-30 minutes
- Models saved to `models/skin_sklearn_models.pkl`
- Metadata saved to `models/skin_sklearn_metadata.json`
- Expected accuracy: 70-80%

## 🔄 Step 3: Model Integration (Automatic)

Once training is complete, the model will **automatically** be used by the system:

1. **Model Loading:** `skin_disease_predictor.py` checks for trained models on startup
2. **Priority:** PyTorch model → Scikit-learn model → Mock mode
3. **Mock Mode Disabled:** When a real model is found, `mock_mode` is set to `False`
4. **UI Update:** Disease Helper page will show "Real Model" instead of "Mock Mode"

### Verify Integration

1. Restart the ML service:
```bash
cd ml-service
python app.py
```

2. Check the logs for:
```
Skin disease model loaded successfully from models/skin_disease_pytorch_best.pth
Model can classify 22 skin conditions
```

3. Test the API:
```bash
curl http://localhost:5001/skin/conditions
```

Should return `"mock_mode": false` if model is loaded.

## 📊 Step 4: Monitor Performance

### Check Model Metadata

```bash
# For PyTorch
cat models/skin_pytorch_metadata.json

# For Scikit-learn
cat models/skin_sklearn_metadata.json
```

### Test Predictions

Use the Disease Helper page in the doctor portal:
1. Navigate to Disease Helper
2. Upload a skin image
3. Check that it shows "Real Model" (not "Mock Mode")
4. Verify confidence scores and predictions

## 🐛 Troubleshooting

### Issue: "Training data not found"

**Solution:** Make sure images are in `ml-service/data/skin_disease/train/[class_name]/`

Run validation:
```bash
python validate_dataset.py
```

### Issue: "Model not loading"

**Solution:** Check that model files exist:
- PyTorch: `models/skin_disease_pytorch_best.pth`
- Scikit-learn: `models/skin_sklearn_models.pkl`

### Issue: "Still showing Mock Mode"

**Solution:** 
1. Restart ML service
2. Check logs for model loading errors
3. Verify model files are in correct location

### Issue: "Low accuracy"

**Solution:**
- Add more training images (aim for 100+ per class)
- Use data augmentation (already included in PyTorch)
- Try ensemble approach (already included in Scikit-learn)
- Consider using PyTorch instead of Scikit-learn

## 📈 Performance Expectations

### PyTorch Model
- **Training Time:** 6-10 hours (with GPU: 2-4 hours)
- **Accuracy:** 85-95%
- **Model Size:** ~50 MB
- **Inference Time:** <1 second per image

### Scikit-learn Model
- **Training Time:** 10-30 minutes
- **Accuracy:** 70-80%
- **Model Size:** ~10 MB
- **Inference Time:** <0.5 seconds per image

## 🎓 Dataset Recommendations

### Minimum Requirements
- At least 50 images per class
- Total: 1,100+ images

### Recommended
- 100-200 images per class
- Total: 2,200-4,400 images

### Optimal
- 500+ images per class
- Total: 11,000+ images

## 📚 Additional Resources

### Datasets
- **HAM10000:** https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000
- **DermNet:** https://www.kaggle.com/datasets/shubhamgoel27/dermnet
- **ISIC Archive:** https://www.isic-archive.com/

### Documentation
- **PyTorch Tutorial:** https://pytorch.org/tutorials/
- **Scikit-learn Guide:** https://scikit-learn.org/stable/user_guide.html
- **Transfer Learning:** https://pytorch.org/tutorials/beginner/transfer_learning_tutorial.html

## 🔧 Advanced Options

### Use TensorFlow (Requires Python 3.11)

If you want to use TensorFlow, you have two options:

1. **Docker Container:**
```bash
# See ml-service/Dockerfile.tensorflow
docker build -f Dockerfile.tensorflow -t skin-ml-tf .
docker run -p 5001:5001 skin-ml-tf
```

2. **Separate Python Environment:**
```bash
# Install Python 3.11 separately
pyenv install 3.11.0
pyenv virtualenv 3.11.0 skin-ml-tf
pyenv activate skin-ml-tf
pip install tensorflow==2.13.0
python train_skin_disease_tensorflow.py
```

## ✅ Success Checklist

- [ ] Dataset downloaded and organized
- [ ] Dataset validated (run `validate_dataset.py`)
- [ ] Training approach chosen (PyTorch or Scikit-learn)
- [ ] Dependencies installed
- [ ] Model trained successfully
- [ ] Model files exist in `models/` directory
- [ ] ML service restarted
- [ ] Mock mode disabled (check API response)
- [ ] Disease Helper shows "Real Model"
- [ ] Predictions working correctly

## 🎉 Next Steps After Training

Once your model is trained and integrated:

1. **Test thoroughly** with various skin images
2. **Monitor accuracy** and confidence scores
3. **Collect feedback** from doctors using the system
4. **Retrain periodically** with new data
5. **Consider ensemble** of multiple models for better accuracy

## 💡 Tips for Best Results

1. **Data Quality:** Use high-quality, diverse images
2. **Data Augmentation:** Already included in PyTorch training
3. **Class Balance:** Try to have similar number of images per class
4. **Validation:** Always validate on held-out test data
5. **Monitoring:** Track model performance over time
6. **Updates:** Retrain model when new data becomes available

---

**Need Help?** Check the spec documents in `.kiro/specs/ml-model-accuracy-improvement/` for detailed requirements, design, and implementation tasks.
