#!/usr/bin/env python3
"""
Enhanced Skin Disease Classification Model Training with TensorFlow
Uses MobileNetV2 with advanced techniques for high accuracy

Requirements:
- Python 3.9-3.11 (TensorFlow not yet compatible with 3.14)
- TensorFlow 2.13+
- Skin disease dataset

To use:
1. Install compatible Python version (3.9-3.11)
2. pip install tensorflow==2.13.0 pillow numpy scikit-learn
3. Prepare dataset in: data/skin_disease/train/ and data/skin_disease/test/
4. Run: python train_skin_disease_tensorflow.py
"""

import os
import numpy as np
import json
from datetime import datetime
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2, EfficientNetB0, ResNet50V2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, TensorBoard
from tensorflow.keras.optimizers import Adam
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt

# Set random seeds for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

class SkinDiseaseModelTrainer:
    def __init__(self, img_size=224, batch_size=32):
        self.img_size = img_size
        self.batch_size = batch_size
        self.class_names = [
            'Acne and Rosacea Photos',
            'Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions',
            'Atopic Dermatitis Photos',
            'Bullous Disease Photos',
            'Cellulitis Impetigo and other Bacterial Infections',
            'Eczema Photos',
            'Exanthems and Drug Eruptions',
            'Hair Loss Photos Alopecia and other Hair Diseases',
            'Herpes HPV and other STDs Photos',
            'Light Diseases and Disorders of Pigmentation',
            'Lupus and other Connective Tissue diseases',
            'Melanoma Skin Cancer Nevi and Moles',
            'Nail Fungus and other Nail Disease',
            'Poison Ivy Photos and other Contact Dermatitis',
            'Psoriasis pictures Lichen Planus and related diseases',
            'Scabies Lyme Disease and other Infestations and Bites',
            'Seborrheic Keratoses and other Benign Tumors',
            'Systemic Disease',
            'Tinea Ringworm Candidiasis and other Fungal Infections',
            'Urticaria Hives',
            'Vascular Tumors',
            'Warts Molluscum and other Viral Infections'
        ]
        self.num_classes = len(self.class_names)
        
    def create_data_generators(self, train_dir, val_dir=None, test_dir=None):
        """Create enhanced data generators with augmentation"""
        print("Creating data generators with augmentation...")
        
        # Training data augmentation for better generalization
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=30,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            vertical_flip=True,
            fill_mode='nearest',
            brightness_range=[0.8, 1.2],
            validation_split=0.2 if val_dir is None else 0.0
        )
        
        # Validation/Test data - only rescaling
        val_datagen = ImageDataGenerator(rescale=1./255)
        
        # Training generator
        train_generator = train_datagen.flow_from_directory(
            train_dir,
            target_size=(self.img_size, self.img_size),
            batch_size=self.batch_size,
            class_mode='categorical',
            subset='training' if val_dir is None else None,
            shuffle=True
        )
        
        # Validation generator
        if val_dir:
            val_generator = val_datagen.flow_from_directory(
                val_dir,
                target_size=(self.img_size, self.img_size),
                batch_size=self.batch_size,
                class_mode='categorical',
                shuffle=False
            )
        else:
            val_generator = train_datagen.flow_from_directory(
                train_dir,
                target_size=(self.img_size, self.img_size),
                batch_size=self.batch_size,
                class_mode='categorical',
                subset='validation',
                shuffle=False
            )
        
        # Test generator (if provided)
        test_generator = None
        if test_dir:
            test_generator = val_datagen.flow_from_directory(
                test_dir,
                target_size=(self.img_size, self.img_size),
                batch_size=self.batch_size,
                class_mode='categorical',
                shuffle=False
            )
        
        return train_generator, val_generator, test_generator
    
    def build_model(self, architecture='mobilenetv2'):
        """Build enhanced model with transfer learning"""
        print(f"Building model with {architecture} architecture...")
        
        # Input layer
        inputs = layers.Input(shape=(self.img_size, self.img_size, 3))
        
        # Data augmentation layers (applied during training)
        x = layers.RandomFlip("horizontal_and_vertical")(inputs)
        x = layers.RandomRotation(0.2)(x)
        x = layers.RandomZoom(0.2)(x)
        
        # Base model selection
        if architecture == 'mobilenetv2':
            base_model = MobileNetV2(
                input_shape=(self.img_size, self.img_size, 3),
                include_top=False,
                weights='imagenet'
            )
        elif architecture == 'efficientnet':
            base_model = EfficientNetB0(
                input_shape=(self.img_size, self.img_size, 3),
                include_top=False,
                weights='imagenet'
            )
        elif architecture == 'resnet':
            base_model = ResNet50V2(
                input_shape=(self.img_size, self.img_size, 3),
                include_top=False,
                weights='imagenet'
            )
        else:
            raise ValueError(f"Unknown architecture: {architecture}")
        
        # Freeze base model initially
        base_model.trainable = False
        
        # Apply base model
        x = base_model(x, training=False)
        
        # Add custom classification head
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(512, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001))(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.4)(x)
        x = layers.Dense(256, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001))(x)
        x = layers.Dropout(0.3)(x)
        outputs = layers.Dense(self.num_classes, activation='softmax')(x)
        
        # Create model
        model = models.Model(inputs, outputs)
        
        return model, base_model
    
    def compile_model(self, model, learning_rate=0.001):
        """Compile model with optimizer and loss"""
        model.compile(
            optimizer=Adam(learning_rate=learning_rate),
            loss='categorical_crossentropy',
            metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=3, name='top_3_accuracy')]
        )
        return model
    
    def train_model(self, model, train_gen, val_gen, epochs=50, fine_tune_epochs=30):
        """Train model with two-phase approach"""
        print("=" * 60)
        print("PHASE 1: Training classification head")
        print("=" * 60)
        
        # Callbacks
        checkpoint = ModelCheckpoint(
            'models/skin_disease_best.keras',
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        )
        
        early_stop = EarlyStopping(
            monitor='val_accuracy',
            patience=10,
            restore_best_weights=True,
            verbose=1
        )
        
        reduce_lr = ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        )
        
        tensorboard = TensorBoard(
            log_dir=f'logs/skin_disease_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
            histogram_freq=1
        )
        
        # Phase 1: Train only the classification head
        history1 = model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=epochs,
            callbacks=[checkpoint, early_stop, reduce_lr, tensorboard],
            verbose=1
        )
        
        print("\n" + "=" * 60)
        print("PHASE 2: Fine-tuning entire model")
        print("=" * 60)
        
        # Phase 2: Unfreeze base model and fine-tune
        base_model = model.layers[3]  # Get base model layer
        base_model.trainable = True
        
        # Fine-tune from the last few layers
        for layer in base_model.layers[:-30]:
            layer.trainable = False
        
        # Recompile with lower learning rate
        model = self.compile_model(model, learning_rate=1e-5)
        
        # Continue training
        history2 = model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=fine_tune_epochs,
            initial_epoch=len(history1.history['loss']),
            callbacks=[checkpoint, early_stop, reduce_lr, tensorboard],
            verbose=1
        )
        
        # Combine histories
        history = {
            'loss': history1.history['loss'] + history2.history['loss'],
            'accuracy': history1.history['accuracy'] + history2.history['accuracy'],
            'val_loss': history1.history['val_loss'] + history2.history['val_loss'],
            'val_accuracy': history1.history['val_accuracy'] + history2.history['val_accuracy']
        }
        
        return model, history
    
    def evaluate_model(self, model, test_gen):
        """Evaluate model performance"""
        print("\n" + "=" * 60)
        print("MODEL EVALUATION")
        print("=" * 60)
        
        # Get predictions
        test_gen.reset()
        predictions = model.predict(test_gen, verbose=1)
        y_pred = np.argmax(predictions, axis=1)
        y_true = test_gen.classes
        
        # Calculate metrics
        accuracy = np.mean(y_pred == y_true)
        print(f"\nTest Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
        
        # Top-3 accuracy
        top3_pred = np.argsort(predictions, axis=1)[:, -3:]
        top3_accuracy = np.mean([y_true[i] in top3_pred[i] for i in range(len(y_true))])
        print(f"Top-3 Accuracy: {top3_accuracy:.4f} ({top3_accuracy*100:.2f}%)")
        
        # Classification report
        print("\nClassification Report:")
        print(classification_report(y_true, y_pred, target_names=self.class_names, zero_division=0))
        
        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        
        return {
            'accuracy': float(accuracy),
            'top3_accuracy': float(top3_accuracy),
            'confusion_matrix': cm.tolist(),
            'predictions': predictions.tolist()
        }
    
    def save_model_and_metadata(self, model, history, evaluation, architecture):
        """Save model and training metadata"""
        print("\nSaving model and metadata...")
        
        # Save model
        model.save('models/skin_disease_mobilenetv2_finetuned.keras')
        print("✅ Model saved to: models/skin_disease_mobilenetv2_finetuned.keras")
        
        # Save metadata
        metadata = {
            'version': datetime.now().strftime('%Y%m%d_%H%M%S'),
            'training_date': datetime.now().isoformat(),
            'architecture': architecture,
            'img_size': self.img_size,
            'num_classes': self.num_classes,
            'class_names': self.class_names,
            'training_history': {
                'final_train_accuracy': float(history['accuracy'][-1]),
                'final_val_accuracy': float(history['val_accuracy'][-1]),
                'final_train_loss': float(history['loss'][-1]),
                'final_val_loss': float(history['val_loss'][-1]),
                'epochs_trained': len(history['loss'])
            },
            'evaluation': evaluation,
            'enhancements': [
                'Transfer learning with ImageNet weights',
                'Two-phase training (freeze then fine-tune)',
                'Advanced data augmentation',
                'Dropout and L2 regularization',
                'Learning rate scheduling',
                'Early stopping',
                'Batch normalization',
                'Top-3 accuracy metric'
            ]
        }
        
        with open('models/skin_model_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("✅ Metadata saved to: models/skin_model_metadata.json")
        
        return metadata
    
    def plot_training_history(self, history):
        """Plot training history"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
        
        # Accuracy plot
        ax1.plot(history['accuracy'], label='Train Accuracy')
        ax1.plot(history['val_accuracy'], label='Val Accuracy')
        ax1.set_title('Model Accuracy')
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Accuracy')
        ax1.legend()
        ax1.grid(True)
        
        # Loss plot
        ax2.plot(history['loss'], label='Train Loss')
        ax2.plot(history['val_loss'], label='Val Loss')
        ax2.set_title('Model Loss')
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('Loss')
        ax2.legend()
        ax2.grid(True)
        
        plt.tight_layout()
        plt.savefig('models/training_history.png', dpi=300, bbox_inches='tight')
        print("✅ Training history plot saved to: models/training_history.png")
        plt.close()


def main():
    """Main training function"""
    print("=" * 60)
    print("ENHANCED SKIN DISEASE CLASSIFICATION MODEL TRAINING")
    print("=" * 60)
    print(f"TensorFlow version: {tf.__version__}")
    print(f"GPU Available: {tf.config.list_physical_devices('GPU')}")
    print()
    
    # Configuration
    IMG_SIZE = 224
    BATCH_SIZE = 32
    EPOCHS = 50
    FINE_TUNE_EPOCHS = 30
    ARCHITECTURE = 'mobilenetv2'  # Options: 'mobilenetv2', 'efficientnet', 'resnet'
    
    # Data directories
    TRAIN_DIR = 'data/skin_disease/train'
    VAL_DIR = 'data/skin_disease/val'  # Optional
    TEST_DIR = 'data/skin_disease/test'  # Optional
    
    # Check if data exists
    if not os.path.exists(TRAIN_DIR):
        print(f"❌ Training data not found at: {TRAIN_DIR}")
        print("\nTo train the model, you need:")
        print("1. Download a skin disease dataset (e.g., HAM10000, DermNet)")
        print("2. Organize images into folders by class")
        print("3. Place in: data/skin_disease/train/")
        print("\nExample structure:")
        print("  data/skin_disease/train/")
        print("    ├── Acne and Rosacea Photos/")
        print("    ├── Eczema Photos/")
        print("    ├── Melanoma Skin Cancer Nevi and Moles/")
        print("    └── ...")
        return
    
    # Initialize trainer
    trainer = SkinDiseaseModelTrainer(img_size=IMG_SIZE, batch_size=BATCH_SIZE)
    
    # Create data generators
    train_gen, val_gen, test_gen = trainer.create_data_generators(
        TRAIN_DIR, 
        VAL_DIR if os.path.exists(VAL_DIR) else None,
        TEST_DIR if os.path.exists(TEST_DIR) else None
    )
    
    print(f"\n📊 Dataset Statistics:")
    print(f"   Training samples: {train_gen.samples}")
    print(f"   Validation samples: {val_gen.samples}")
    if test_gen:
        print(f"   Test samples: {test_gen.samples}")
    print(f"   Number of classes: {train_gen.num_classes}")
    print()
    
    # Build model
    model, base_model = trainer.build_model(architecture=ARCHITECTURE)
    model = trainer.compile_model(model)
    
    print(f"\n📐 Model Architecture:")
    print(f"   Base: {ARCHITECTURE}")
    print(f"   Input size: {IMG_SIZE}x{IMG_SIZE}x3")
    print(f"   Output classes: {trainer.num_classes}")
    print(f"   Total parameters: {model.count_params():,}")
    print()
    
    # Train model
    model, history = trainer.train_model(
        model, train_gen, val_gen, 
        epochs=EPOCHS, 
        fine_tune_epochs=FINE_TUNE_EPOCHS
    )
    
    # Evaluate model
    evaluation = trainer.evaluate_model(model, test_gen if test_gen else val_gen)
    
    # Save model and metadata
    metadata = trainer.save_model_and_metadata(model, history, evaluation, ARCHITECTURE)
    
    # Plot training history
    trainer.plot_training_history(history)
    
    print("\n" + "=" * 60)
    print("✅ TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print(f"Final Validation Accuracy: {history['val_accuracy'][-1]:.4f}")
    print(f"Test Accuracy: {evaluation['accuracy']:.4f}")
    print(f"Top-3 Accuracy: {evaluation['top3_accuracy']:.4f}")
    print(f"Model saved to: models/skin_disease_mobilenetv2_finetuned.keras")
    print("=" * 60)


if __name__ == "__main__":
    main()
