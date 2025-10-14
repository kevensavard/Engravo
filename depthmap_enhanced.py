#!/usr/bin/env python3
"""
Enhanced Depth Map Generator - Focus on Smooth Gradients
========================================================
"""

import sys
import json
import argparse
import warnings
import os
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

# Suppress all warnings and set environment variables
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
os.environ['HF_HUB_DISABLE_PROGRESS_BARS'] = '1'

# Redirect all output to devnull during imports
from contextlib import redirect_stdout, redirect_stderr

class DevNull:
    def write(self, x): pass
    def flush(self): pass

# Suppress all output during imports
sys.stdout = DevNull()
sys.stderr = DevNull()

try:
    from transformers import pipeline
    MIDAS_AVAILABLE = True
except:
    MIDAS_AVAILABLE = False

# Restore stdout/stderr
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__

class EnhancedDepthGenerator:
    """Enhanced depth generator focused on smooth gradients."""
    
    def __init__(self):
        self.depth_estimator = None
        if MIDAS_AVAILABLE:
            try:
                with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
                    self.depth_estimator = pipeline(
                        "depth-estimation", 
                        model="Intel/dpt-large"
                    )
            except:
                pass
    
    def load_image(self, image_path: str) -> np.ndarray:
        """Load and preprocess image."""
        if isinstance(image_path, str):
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"Could not load image from {image_path}")
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        else:
            img = np.array(image_path)
        
        # Resize to manageable size while maintaining aspect ratio
        h, w = img.shape[:2]
        if max(h, w) > 512:
            scale = 512 / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        return img
    
    def generate_depth_map(self, image: np.ndarray, detail_level: int = 50) -> np.ndarray:
        """Generate enhanced depth map with smooth gradients."""
        
        # Convert to grayscale for processing
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Try AI-based depth estimation first
        if self.depth_estimator is not None:
            try:
                # Convert to PIL Image for transformers
                pil_image = Image.fromarray(image)
                
                # Get depth prediction
                with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
                    result = self.depth_estimator(pil_image)
                
                depth = np.array(result['depth'])
                
                # Normalize to 0-1
                depth = (depth - depth.min()) / (depth.max() - depth.min())
                
                # Invert for laser engraving (bright = closer)
                depth = 1.0 - depth
                
            except Exception as e:
                # Fall back to traditional method
                depth = self._traditional_depth_estimation(gray)
        else:
            # Use traditional method
            depth = self._traditional_depth_estimation(gray)
        
        # Enhance the depth map for better gradients
        depth = self._enhance_gradients(depth, detail_level)
        
        return depth
    
    def _traditional_depth_estimation(self, gray: np.ndarray) -> np.ndarray:
        """Traditional depth estimation using multiple techniques."""
        
        # Method 1: Brightness-based depth (brighter = closer)
        brightness_depth = gray.astype(np.float32) / 255.0
        
        # Method 2: Edge-based depth (edges = closer)
        edges = cv2.Canny(gray, 50, 150)
        edge_depth = (255 - edges).astype(np.float32) / 255.0
        
        # Method 3: Distance transform (center = closer)
        binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        dist_transform = cv2.distanceTransform(binary, cv2.DIST_L2, 5)
        dist_depth = (dist_transform / dist_transform.max()).astype(np.float32)
        
        # Method 4: Gaussian blur for smoothness
        blurred = cv2.GaussianBlur(gray, (21, 21), 0)
        blur_depth = blurred.astype(np.float32) / 255.0
        
        # Combine methods with weights
        depth = (
            0.4 * brightness_depth +
            0.3 * edge_depth +
            0.2 * dist_depth +
            0.1 * blur_depth
        )
        
        # Normalize
        depth = (depth - depth.min()) / (depth.max() - depth.min())
        
        return depth
    
    def _enhance_gradients(self, depth: np.ndarray, detail_level: int) -> np.ndarray:
        """Enhance gradients for smooth transitions."""
        
        detail_weight = detail_level / 100.0
        
        # Step 1: Apply bilateral filtering for edge-preserving smoothing
        depth_8bit = (depth * 255).astype(np.uint8)
        
        # Adjust smoothing based on detail level
        smoothing = 0.3 + (1 - detail_weight) * 0.7  # Less smoothing for high detail
        d = max(5, int(15 * smoothing))
        sigma_color = max(50, int(100 * smoothing))
        sigma_space = max(50, int(100 * smoothing))
        
        smoothed = cv2.bilateralFilter(depth_8bit, d, sigma_color, sigma_space)
        
        # Step 2: Apply adaptive histogram equalization for better gradients
        clahe = cv2.createCLAHE(clipLimit=2.0 + detail_weight, tileGridSize=(8, 8))
        enhanced = clahe.apply(smoothed)
        
        # Step 3: Apply Gaussian blur for smoother transitions
        if detail_weight > 0.7:  # High detail - minimal blur
            enhanced = cv2.GaussianBlur(enhanced, (3, 3), 0)
        else:  # Lower detail - more blur for smoother gradients
            blur_size = int(5 + (1 - detail_weight) * 10)
            # Ensure odd kernel size
            blur_size = blur_size if blur_size % 2 == 1 else blur_size + 1
            blur_size = max(3, min(blur_size, 21))  # Clamp between 3 and 21
            enhanced = cv2.GaussianBlur(enhanced, (blur_size, blur_size), 0)
        
        # Step 4: Apply gamma correction for better depth perception
        gamma = 0.7 + detail_weight * 0.6  # Adjust gamma based on detail
        enhanced = np.power(enhanced / 255.0, gamma) * 255.0
        
        # Step 5: Apply contrast stretching
        min_val = np.percentile(enhanced, 1)
        max_val = np.percentile(enhanced, 99)
        enhanced = np.clip((enhanced - min_val) / (max_val - min_val) * 255, 0, 255)
        
        # Step 6: Final smoothing for laser engraving
        enhanced = cv2.GaussianBlur(enhanced, (3, 3), 0)
        
        return enhanced.astype(np.float32) / 255.0

def main():
    """Main function - only outputs JSON."""
    try:
        parser = argparse.ArgumentParser(description='Generate enhanced depth map')
        parser.add_argument('input_image', help='Path to input image')
        parser.add_argument('output_path', help='Path to save depth map')
        parser.add_argument('detail_level', type=int, default=50, help='Detail level (0-100)')
        
        args = parser.parse_args()
        
        # Initialize generator
        generator = EnhancedDepthGenerator()
        
        # Load image
        image = generator.load_image(args.input_image)
        
        # Generate depth map
        with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
            depth_map = generator.generate_depth_map(image, args.detail_level)
        
        # Save depth map
        depth_8bit = (depth_map * 255).astype(np.uint8)
        cv2.imwrite(args.output_path, depth_8bit)
        
        # Return success result as JSON
        result = {
            "success": True,
            "input_image": args.input_image,
            "output_path": args.output_path,
            "detail_level": args.detail_level,
            "model_used": "enhanced",
            "output_size": depth_map.shape,
            "message": "Enhanced depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image if 'args' in locals() else "unknown",
            "message": "Failed to generate enhanced depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
