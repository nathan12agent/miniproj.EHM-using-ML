#!/usr/bin/env python3
"""
Create a minimal sample dataset for testing the training pipeline
This creates synthetic images - NOT for production use!
"""
import os
import numpy as np
from PIL import Image

class_names = [
    'Acne and Rosacea Photos',
    'Eczema Photos',
    'Melanoma Skin Cancer Nevi and Moles',
    'Psoriasis pictures Lichen Planus and related diseases',
    'Warts Molluscum and other Viral Infections'
]

def create_synthetic_skin_image(class_name, index):
    """Create a synthetic skin-like image"""
    # Create 256x256 RGB image
    img = np.random.randint(0, 256, (256, 256, 3), dtype=np.uint8)
    
    # Add some variation based on class
    if 'Acne' in class_name:
        # Reddish tint
        img[:, :, 0] = np.clip(img[:, :, 0] + 50, 0, 255)
    elif 'Eczema' in class_name:
        # Pinkish tint
        img[:, :, 0] = np.clip(img[:, :, 0] + 30, 0, 255)
        img[:, :, 2] = np.clip(img[:, :, 2] + 30, 0, 255)
    elif 'Melanoma' in class_name:
        # Darker tint
        img = np.clip(img - 50, 0, 255).astype(np.uint8)
    elif 'Psoriasis' in class_name:
        # Lighter tint
        img = np.clip(img + 30, 0, 255).astype(np.uint8)
    elif 'Warts' in class_name:
        # Yellowish tint
        img[:, :, 0] = np.clip(img[:, :, 0] + 40, 0, 255)
        img[:, :, 1] = np.clip(img[:, :, 1] + 40, 0, 255)
    
    return Image.fromarray(img)

def create_sample_dataset(num_images_per_class=20):
    """Create sample dataset"""
    print("=" * 70)
    print("CREATING SAMPLE DATASET FOR TESTING")
    print("=" * 70)
    print("\n⚠️  WARNING: This creates synthetic images for TESTING ONLY!")
    print("For production, download real skin disease images (HAM10000 or DermNet)\n")
    
    base_dir = 'data/skin_disease/train'
    total_created = 0
    
    for class_name in class_names:
        class_dir = os.path.join(base_dir, class_name)
        os.makedirs(class_dir, exist_ok=True)
        
        print(f"Creating {num_images_per_class} images for: {class_name}")
        
        for i in range(num_images_per_class):
            img = create_synthetic_skin_image(class_name, i)
            img_path = os.path.join(class_dir, f'sample_{i:03d}.jpg')
            img.save(img_path, 'JPEG', quality=85)
            total_created += 1
    
    print(f"\n✅ Created {total_created} sample images in {len(class_names)} classes")
    print(f"\nDataset location: {base_dir}")
    print("\nNext steps:")
    print("  1. Run: python validate_dataset.py")
    print("  2. Run: python train_skin_sklearn.py (fast, 10-30 min)")
    print("  3. For production: Replace with real images from HAM10000 or DermNet")
    print("\n" + "=" * 70)

if __name__ == "__main__":
    create_sample_dataset(num_images_per_class=20)
