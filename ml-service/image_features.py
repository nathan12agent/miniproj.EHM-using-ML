#!/usr/bin/env python3
"""
Image Feature Extraction for Skin Disease Classification
"""
import numpy as np
from PIL import Image
import cv2


class ImageFeatureExtractor:
    """Extract features from skin disease images"""
    
    def __init__(self, img_size=224):
        self.img_size = img_size
    
    def extract_color_features(self, image):
        """Extract color-based features"""
        # Convert to different color spaces
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        
        features = []
        
        # RGB statistics
        for channel in range(3):
            features.extend([
                np.mean(image[:,:,channel]),
                np.std(image[:,:,channel]),
                np.median(image[:,:,channel]),
                np.percentile(image[:,:,channel], 25),
                np.percentile(image[:,:,channel], 75)
            ])
        
        # HSV statistics
        for channel in range(3):
            features.extend([
                np.mean(hsv[:,:,channel]),
                np.std(hsv[:,:,channel])
            ])
        
        # LAB statistics
        for channel in range(3):
            features.extend([
                np.mean(lab[:,:,channel]),
                np.std(lab[:,:,channel])
            ])
        
        return features
    
    def extract_texture_features(self, image):
        """Extract texture-based features using GLCM"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        features = []
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 150)
        features.append(np.mean(edges))
        features.append(np.std(edges))
        
        # Gradient features
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        features.append(np.mean(np.abs(grad_x)))
        features.append(np.mean(np.abs(grad_y)))
        features.append(np.std(grad_x))
        features.append(np.std(grad_y))
        
        # Laplacian (texture measure)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        features.append(np.mean(np.abs(laplacian)))
        features.append(np.std(laplacian))
        
        return features
    
    def extract_shape_features(self, image):
        """Extract shape-based features"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Threshold to find lesion
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        features = []
        
        if contours:
            # Largest contour (assumed to be lesion)
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Area and perimeter
            area = cv2.contourArea(largest_contour)
            perimeter = cv2.arcLength(largest_contour, True)
            
            # Circularity
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter ** 2)
            else:
                circularity = 0
            
            # Bounding box
            x, y, w, h = cv2.boundingRect(largest_contour)
            aspect_ratio = w / h if h > 0 else 0
            extent = area / (w * h) if (w * h) > 0 else 0
            
            features.extend([
                area / (self.img_size ** 2),  # Normalized area
                perimeter / (self.img_size * 4),  # Normalized perimeter
                circularity,
                aspect_ratio,
                extent
            ])
        else:
            features.extend([0, 0, 0, 0, 0])
        
        return features
    
    def extract_all_features(self, image_path):
        """Extract all features from an image"""
        # Load and resize image
        image = Image.open(image_path).convert('RGB')
        image = image.resize((self.img_size, self.img_size))
        image_array = np.array(image)
        
        # Extract features
        color_features = self.extract_color_features(image_array)
        texture_features = self.extract_texture_features(image_array)
        shape_features = self.extract_shape_features(image_array)
        
        # Combine all features
        all_features = color_features + texture_features + shape_features
        
        return np.array(all_features)
    
    def extract_all_features_from_array(self, image_array):
        """Extract all features from an image array (for prediction)"""
        # Extract features
        color_features = self.extract_color_features(image_array)
        texture_features = self.extract_texture_features(image_array)
        shape_features = self.extract_shape_features(image_array)
        
        # Combine all features
        all_features = color_features + texture_features + shape_features
        
        return np.array(all_features)
