# Quick Start: Train Skin Disease Model

## 🚀 Fastest Path to Real Model

### Step 1: Get Dataset (Choose One)

**Option A: Download Sample Dataset**
```bash
# Download from Kaggle (requires Kaggle account)
pip install kaggle
kaggle datasets download -d kmader/skin-cancer-mnist-ham10000
unzip skin-cancer-mnist-ham10000.zip -d data/ham10000
```

**Option B: Use Your Own Images**
Place images in: `ml-service/data/skin_disease/train/[class_name]/`

### Step 2: Validate Dataset
```bash
cd ml-service
python validate_dataset.py
```

### Step 3: Choose Training Method

**For Best Accuracy (Recommended):**
```bash
pip install torch torchvision timm pillow
python train_skin_disease_pytorch.py
# Wait 6-10 hours
# Model saved to: models/skin_disease_pytorch_best.pth
```

**For Quick Testing:**
```bash
pip install scikit-learn opencv-python pillow numpy
python train_skin_sklearn.py
# Wait 10-30 minutes
# Model saved to: models/skin_sklearn_models.pkl
```

### Step 4: Restart ML Service
```bash
python app.py
# Check logs for: "Skin disease model loaded successfully"
```

### Step 5: Test
1. Open Disease Helper page
2. Upload skin image
3. Should show "Real Model" (not "Mock Mode")
4. Check predictions and confidence scores

## ✅ Done!

Your system now uses a real ML model instead of mock predictions.

---

**See SKIN_MODEL_TRAINING_README.md for detailed instructions**
