#!/usr/bin/env python3
"""
Dataset Validation Script for Skin Disease Classification

This script validates the dataset structure and reports statistics.
"""
import os
from pathlib import Path

class DatasetValidator:
    def __init__(self, data_dir='data/skin_disease'):
        self.data_dir = data_dir
        self.expected_classes = [
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
        self.valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif'}
    
    def validate_directory(self, split='train'):
        """Validate a specific split (train/val/test)"""
        split_dir = os.path.join(self.data_dir, split)
        
        if not os.path.exists(split_dir):
            return {
                'exists': False,
                'error': f"Directory {split_dir} does not exist"
            }
        
        results = {
            'exists': True,
            'split': split,
            'total_images': 0,
            'classes_found': [],
            'classes_missing': [],
            'class_stats': {},
            'invalid_files': [],
            'warnings': []
        }
        
        # Check each expected class
        for class_name in self.expected_classes:
            class_dir = os.path.join(split_dir, class_name)
            
            if not os.path.exists(class_dir):
                results['classes_missing'].append(class_name)
                continue
            
            results['classes_found'].append(class_name)
            
            # Count images in this class
            image_count = 0
            invalid_files = []
            
            for file_name in os.listdir(class_dir):
                file_path = os.path.join(class_dir, file_name)
                
                # Skip .gitkeep files
                if file_name == '.gitkeep':
                    continue
                
                # Check if it's a file
                if not os.path.isfile(file_path):
                    continue
                
                # Check extension
                ext = Path(file_name).suffix.lower()
                if ext in self.valid_extensions:
                    image_count += 1
                else:
                    invalid_files.append(file_name)
            
            results['class_stats'][class_name] = {
                'count': image_count,
                'invalid_files': invalid_files
            }
            results['total_images'] += image_count
            
            if invalid_files:
                results['invalid_files'].extend([
                    f"{class_name}/{f}" for f in invalid_files
                ])
            
            if image_count == 0:
                results['warnings'].append(
                    f"Class '{class_name}' has no valid images"
                )
        
        return results
    
    def print_report(self, results):
        """Print validation report"""
        if not results['exists']:
            print(f"❌ {results['error']}")
            return
        
        split = results['split']
        print(f"\n{'='*70}")
        print(f"DATASET VALIDATION REPORT - {split.upper()} SPLIT")
        print(f"{'='*70}")
        
        # Summary
        print(f"\n📊 Summary:")
        print(f"  Total Images: {results['total_images']}")
        print(f"  Classes Found: {len(results['classes_found'])}/22")
        print(f"  Classes Missing: {len(results['classes_missing'])}")
        
        # Missing classes
        if results['classes_missing']:
            print(f"\n⚠️  Missing Classes ({len(results['classes_missing'])}):")
            for class_name in results['classes_missing']:
                print(f"  - {class_name}")
        
        # Class statistics
        if results['class_stats']:
            print(f"\n📈 Class Statistics:")
            sorted_classes = sorted(
                results['class_stats'].items(),
                key=lambda x: x[1]['count'],
                reverse=True
            )
            
            for class_name, stats in sorted_classes:
                count = stats['count']
                status = "✅" if count > 0 else "⚠️ "
                print(f"  {status} {class_name}: {count} images")
        
        # Invalid files
        if results['invalid_files']:
            print(f"\n⚠️  Invalid Files ({len(results['invalid_files'])}):")
            for file_path in results['invalid_files'][:10]:  # Show first 10
                print(f"  - {file_path}")
            if len(results['invalid_files']) > 10:
                print(f"  ... and {len(results['invalid_files']) - 10} more")
        
        # Warnings
        if results['warnings']:
            print(f"\n⚠️  Warnings:")
            for warning in results['warnings']:
                print(f"  - {warning}")
        
        # Recommendations
        print(f"\n💡 Recommendations:")
        if results['total_images'] == 0:
            print("  - Add training images to the class directories")
            print("  - Download HAM10000 or DermNet dataset")
            print("  - Organize images into the 22 class subdirectories")
        elif results['total_images'] < 1000:
            print("  - Consider adding more images for better model performance")
            print("  - Aim for at least 100 images per class")
        else:
            print("  - Dataset looks good! Ready for training")
        
        print(f"\n{'='*70}\n")
    
    def validate_all(self):
        """Validate all splits"""
        print("\n🔍 Validating Skin Disease Dataset...")
        
        for split in ['train', 'val', 'test']:
            results = self.validate_directory(split)
            self.print_report(results)
        
        return True


def main():
    """Main validation function"""
    validator = DatasetValidator()
    validator.validate_all()
    
    print("✅ Validation complete!")
    print("\nNext steps:")
    print("  1. Download skin disease dataset (HAM10000 or DermNet)")
    print("  2. Organize images into the 22 class directories")
    print("  3. Run this script again to verify")
    print("  4. Start training with train_skin_disease_pytorch.py or train_skin_sklearn.py")


if __name__ == "__main__":
    main()
