#!/usr/bin/env python3
"""
Skin Disease Classification with PyTorch
Works with Python 3.14!

Installation:
    pip install torch torchvision timm pillow

Usage:
    python train_skin_disease_pytorch.py
"""

import os
import json
import numpy as np
from datetime import datetime
from PIL import Image

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
import timm  # PyTorch Image Models - has many pre-trained models

class SkinDiseaseDataset(Dataset):
    """Custom dataset for skin disease images"""
    def __init__(self, root_dir, transform=None):
        self.root_dir = root_dir
        self.transform = transform
        self.classes = sorted(os.listdir(root_dir))
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}
        
        # Load all image paths
        self.images = []
        self.labels = []
        
        for class_name in self.classes:
            class_dir = os.path.join(root_dir, class_name)
            if os.path.isdir(class_dir):
                for img_name in os.listdir(class_dir):
                    if img_name.lower().endswith(('.png', '.jpg', '.jpeg')):
                        self.images.append(os.path.join(class_dir, img_name))
                        self.labels.append(self.class_to_idx[class_name])
    
    def __len__(self):
        return len(self.images)
    
    def __getitem__(self, idx):
        img_path = self.images[idx]
        image = Image.open(img_path).convert('RGB')
        label = self.labels[idx]
        
        if self.transform:
            image = self.transform(image)
        
        return image, label


class SkinDiseaseModel(nn.Module):
    """Skin disease classification model"""
    def __init__(self, num_classes=22, model_name='mobilenetv2_100'):
        super(SkinDiseaseModel, self).__init__()
        
        # Load pre-trained model from timm
        self.backbone = timm.create_model(model_name, pretrained=True, num_classes=0)
        
        # Get feature dimension
        with torch.no_grad():
            dummy_input = torch.randn(1, 3, 224, 224)
            features = self.backbone(dummy_input)
            feature_dim = features.shape[1]
        
        # Custom classification head
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(feature_dim, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )
    
    def forward(self, x):
        features = self.backbone(x)
        output = self.classifier(features)
        return output


class SkinDiseaseTrainer:
    """Trainer for skin disease model"""
    def __init__(self, num_classes=22, device='cuda'):
        self.num_classes = num_classes
        self.device = device if torch.cuda.is_available() else 'cpu'
        print(f"Using device: {self.device}")
        
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
    
    def get_transforms(self):
        """Get data transforms"""
        train_transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.RandomCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(),
            transforms.RandomRotation(30),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        val_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        return train_transform, val_transform
    
    def create_dataloaders(self, train_dir, val_dir=None, batch_size=32):
        """Create data loaders"""
        train_transform, val_transform = self.get_transforms()
        
        # Training dataset
        train_dataset = SkinDiseaseDataset(train_dir, transform=train_transform)
        
        # Validation dataset
        if val_dir and os.path.exists(val_dir):
            val_dataset = SkinDiseaseDataset(val_dir, transform=val_transform)
        else:
            # Split training data
            train_size = int(0.8 * len(train_dataset))
            val_size = len(train_dataset) - train_size
            train_dataset, val_dataset = torch.utils.data.random_split(
                train_dataset, [train_size, val_size]
            )
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, 
                                 shuffle=True, num_workers=4, pin_memory=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, 
                               shuffle=False, num_workers=4, pin_memory=True)
        
        return train_loader, val_loader
    
    def train_epoch(self, model, loader, criterion, optimizer, epoch):
        """Train for one epoch"""
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for batch_idx, (images, labels) in enumerate(loader):
            images, labels = images.to(self.device), labels.to(self.device)
            
            # Forward pass
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            # Backward pass
            loss.backward()
            optimizer.step()
            
            # Statistics
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            if batch_idx % 10 == 0:
                print(f'Epoch {epoch} [{batch_idx}/{len(loader)}] '
                      f'Loss: {loss.item():.4f} Acc: {100.*correct/total:.2f}%')
        
        epoch_loss = running_loss / len(loader)
        epoch_acc = 100. * correct / total
        return epoch_loss, epoch_acc
    
    def validate(self, model, loader, criterion):
        """Validate model"""
        model.eval()
        running_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for images, labels in loader:
                images, labels = images.to(self.device), labels.to(self.device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                running_loss += loss.item()
                _, predicted = outputs.max(1)
                total += labels.size(0)
                correct += predicted.eq(labels).sum().item()
        
        val_loss = running_loss / len(loader)
        val_acc = 100. * correct / total
        return val_loss, val_acc
    
    def train_model(self, train_dir, val_dir=None, epochs=50, batch_size=32, lr=0.001):
        """Train the model"""
        print("=" * 60)
        print("TRAINING SKIN DISEASE MODEL WITH PYTORCH")
        print("=" * 60)
        
        # Create data loaders
        train_loader, val_loader = self.create_dataloaders(train_dir, val_dir, batch_size)
        print(f"Training samples: {len(train_loader.dataset)}")
        print(f"Validation samples: {len(val_loader.dataset)}")
        
        # Create model
        model = SkinDiseaseModel(num_classes=self.num_classes).to(self.device)
        print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")
        
        # Loss and optimizer
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', 
                                                         factor=0.5, patience=5, verbose=True)
        
        # Training loop
        best_acc = 0.0
        history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}
        
        for epoch in range(1, epochs + 1):
            print(f"\nEpoch {epoch}/{epochs}")
            print("-" * 60)
            
            # Train
            train_loss, train_acc = self.train_epoch(model, train_loader, criterion, optimizer, epoch)
            
            # Validate
            val_loss, val_acc = self.validate(model, val_loader, criterion)
            
            # Update scheduler
            scheduler.step(val_acc)
            
            # Save history
            history['train_loss'].append(train_loss)
            history['train_acc'].append(train_acc)
            history['val_loss'].append(val_loss)
            history['val_acc'].append(val_acc)
            
            print(f"Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}%")
            print(f"Val Loss: {val_loss:.4f} Acc: {val_acc:.2f}%")
            
            # Save best model
            if val_acc > best_acc:
                best_acc = val_acc
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'accuracy': val_acc,
                    'class_names': self.class_names
                }, 'models/skin_disease_pytorch_best.pth')
                print(f"✅ Saved best model (Acc: {val_acc:.2f}%)")
        
        print("\n" + "=" * 60)
        print(f"✅ TRAINING COMPLETED!")
        print(f"Best Validation Accuracy: {best_acc:.2f}%")
        print("=" * 60)
        
        return model, history, best_acc
    
    def save_metadata(self, history, best_acc):
        """Save training metadata"""
        metadata = {
            'version': datetime.now().strftime('%Y%m%d_%H%M%S'),
            'training_date': datetime.now().isoformat(),
            'framework': 'PyTorch',
            'model': 'MobileNetV2',
            'num_classes': self.num_classes,
            'class_names': self.class_names,
            'best_accuracy': float(best_acc),
            'final_train_accuracy': float(history['train_acc'][-1]),
            'final_val_accuracy': float(history['val_acc'][-1]),
            'epochs_trained': len(history['train_loss']),
            'device': self.device,
            'enhancements': [
                'PyTorch implementation (Python 3.14 compatible)',
                'Transfer learning with ImageNet weights',
                'Advanced data augmentation',
                'Learning rate scheduling',
                'Dropout and batch normalization',
                'Weight decay regularization'
            ]
        }
        
        with open('models/skin_pytorch_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("✅ Metadata saved to: models/skin_pytorch_metadata.json")
        return metadata


def main():
    """Main training function"""
    # Configuration
    TRAIN_DIR = 'data/skin_disease/train'
    VAL_DIR = 'data/skin_disease/val'  # Optional
    EPOCHS = 50
    BATCH_SIZE = 32
    LEARNING_RATE = 0.001
    
    # Check if data exists
    if not os.path.exists(TRAIN_DIR):
        print(f"❌ Training data not found at: {TRAIN_DIR}")
        print("\nPlease organize your dataset:")
        print("  data/skin_disease/train/")
        print("    ├── Acne and Rosacea Photos/")
        print("    ├── Eczema Photos/")
        print("    └── ...")
        return
    
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    # Initialize trainer
    trainer = SkinDiseaseTrainer()
    
    # Train model
    model, history, best_acc = trainer.train_model(
        TRAIN_DIR, 
        VAL_DIR if os.path.exists(VAL_DIR) else None,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        lr=LEARNING_RATE
    )
    
    # Save metadata
    trainer.save_metadata(history, best_acc)
    
    print("\n🎉 Model ready for use!")
    print("Load with: torch.load('models/skin_disease_pytorch_best.pth')")


if __name__ == "__main__":
    main()
