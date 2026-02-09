#!/usr/bin/env python3
"""
Create class subdirectories for skin disease dataset
"""
import os

class_names = [
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

# Create directories
base_dir = 'data/skin_disease/train'
os.makedirs(base_dir, exist_ok=True)

for class_name in class_names:
    class_dir = os.path.join(base_dir, class_name)
    os.makedirs(class_dir, exist_ok=True)
    
    # Create .gitkeep file
    gitkeep_path = os.path.join(class_dir, '.gitkeep')
    with open(gitkeep_path, 'w') as f:
        f.write(f'# Place {class_name} images here\n')

print(f"✅ Created {len(class_names)} class directories in {base_dir}")
print("\nClass directories:")
for i, class_name in enumerate(class_names, 1):
    print(f"  {i}. {class_name}")
