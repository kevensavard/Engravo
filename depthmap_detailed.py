#!/usr/bin/env python3
"""
Detailed Depth Map Generator - Maximum Detail Preservation
==========================================================
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

class DetailedDepthGenerator:
    """Detailed depth generator with maximum detail preservation."""
    
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
        
        # Keep original size for maximum detail
        h, w = img.shape[:2]
        if max(h, w) > 1024:  # Only resize if very large
            scale = 1024 / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        return img
    
    def generate_depth_map(self, image: np.ndarray, detail_level: int = 50) -> np.ndarray:
        """Generate detailed depth map with maximum detail preservation."""
        
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
                
                # Enhance the AI result with detail preservation
                depth = self._enhance_ai_depth(depth, gray, detail_level)
                
            except Exception as e:
                # Fall back to detailed traditional method
                depth = self._detailed_traditional_depth(gray, detail_level)
        else:
            # Use detailed traditional method
            depth = self._detailed_traditional_depth(gray, detail_level)
        
        return depth
    
    def _enhance_ai_depth(self, ai_depth: np.ndarray, gray: np.ndarray, detail_level: int) -> np.ndarray:
        """Enhance AI depth with additional detail from traditional methods."""
        
        detail_weight = detail_level / 100.0
        
        # Create additional depth layers
        brightness_depth = gray.astype(np.float32) / 255.0
        edge_depth = self._create_edge_depth(gray)
        texture_depth = self._create_texture_depth(gray)
        
        # Combine AI depth with traditional methods
        enhanced_depth = (
            0.5 * ai_depth +  # AI depth as base
            0.2 * brightness_depth +  # Brightness
            0.2 * edge_depth +  # Edge information
            0.1 * texture_depth  # Texture information
        )
        
        # Apply detail enhancement based on detail level
        if detail_weight > 0.5:
            # High detail - preserve more texture
            enhanced_depth = self._preserve_fine_details(enhanced_depth, gray, detail_weight)
        
        return enhanced_depth
    
    def _detailed_traditional_depth(self, gray: np.ndarray, detail_level: int) -> np.ndarray:
        """Detailed traditional depth estimation with maximum detail."""
        
        detail_weight = detail_level / 100.0
        
        # Method 1: Brightness-based depth (brighter = closer)
        brightness_depth = gray.astype(np.float32) / 255.0
        
        # Method 2: Edge-based depth (edges = closer)
        edge_depth = self._create_edge_depth(gray)
        
        # Method 3: Texture-based depth
        texture_depth = self._create_texture_depth(gray)
        
        # Method 4: Gradient-based depth
        gradient_depth = self._create_gradient_depth(gray)
        
        # Method 5: Local contrast depth
        contrast_depth = self._create_contrast_depth(gray)
        
        # Combine methods with detail-aware weights
        depth = (
            0.3 * brightness_depth +
            0.25 * edge_depth +
            0.2 * texture_depth +
            0.15 * gradient_depth +
            0.1 * contrast_depth
        )
        
        # Apply detail enhancement
        if detail_weight > 0.3:
            depth = self._preserve_fine_details(depth, gray, detail_weight)
        
        # Normalize
        depth = (depth - depth.min()) / (depth.max() - depth.min())
        
        return depth
    
    def _create_edge_depth(self, gray: np.ndarray) -> np.ndarray:
        """Create depth map from edges."""
        # Multi-scale edge detection
        edges1 = cv2.Canny(gray, 30, 100)
        edges2 = cv2.Canny(gray, 50, 150)
        edges3 = cv2.Canny(gray, 100, 200)
        
        # Combine edges
        combined_edges = cv2.bitwise_or(edges1, cv2.bitwise_or(edges2, edges3))
        
        # Distance transform from edges
        dist_transform = cv2.distanceTransform(255 - combined_edges, cv2.DIST_L2, 5)
        edge_depth = (dist_transform / dist_transform.max()).astype(np.float32)
        
        return edge_depth
    
    def _create_texture_depth(self, gray: np.ndarray) -> np.ndarray:
        """Create depth map from texture analysis."""
        # Apply Laplacian for texture
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        laplacian = np.absolute(laplacian)
        
        # Normalize
        texture_depth = (laplacian / laplacian.max()).astype(np.float32)
        
        return texture_depth
    
    def _create_gradient_depth(self, gray: np.ndarray) -> np.ndarray:
        """Create depth map from gradients."""
        # Calculate gradients
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        
        # Gradient magnitude
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        
        # Normalize
        gradient_depth = (gradient_magnitude / gradient_magnitude.max()).astype(np.float32)
        
        return gradient_depth
    
    def _create_contrast_depth(self, gray: np.ndarray) -> np.ndarray:
        """Create depth map from local contrast."""
        # Local contrast using standard deviation in sliding window
        kernel = np.ones((9, 9), np.float32) / 81
        mean = cv2.filter2D(gray.astype(np.float32), -1, kernel)
        
        # Calculate local standard deviation
        squared = cv2.filter2D((gray.astype(np.float32))**2, -1, kernel)
        variance = squared - mean**2
        std_dev = np.sqrt(np.maximum(variance, 0))
        
        # Normalize
        contrast_depth = (std_dev / std_dev.max()).astype(np.float32)
        
        return contrast_depth
    
    def _preserve_fine_details(self, depth: np.ndarray, gray: np.ndarray, detail_weight: float) -> np.ndarray:
        """Preserve fine details in the depth map."""
        
        # Create detail map from high-frequency components
        # Apply Gaussian blur and subtract from original
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        details = gray.astype(np.float32) - blurred.astype(np.float32)
        details = np.absolute(details)
        
        # Normalize details
        if details.max() > 0:
            details = details / details.max()
        
        # Enhance depth map with details
        detail_enhancement = 0.1 + detail_weight * 0.3
        enhanced_depth = depth + details * detail_enhancement
        
        # Apply sharpening filter
        kernel = np.array([[-1, -1, -1],
                          [-1,  9, -1],
                          [-1, -1, -1]])
        
        # Convert to 8-bit for filtering
        depth_8bit = (enhanced_depth * 255).astype(np.uint8)
        sharpened = cv2.filter2D(depth_8bit, -1, kernel)
        
        # Blend original and sharpened based on detail weight
        blend_factor = detail_weight * 0.5
        final_depth = (1 - blend_factor) * enhanced_depth + blend_factor * (sharpened.astype(np.float32) / 255.0)
        
        return np.clip(final_depth, 0, 1)

def main():
    """Main function - only outputs JSON."""
    try:
        parser = argparse.ArgumentParser(description='Generate detailed depth map')
        parser.add_argument('input_image', help='Path to input image')
        parser.add_argument('output_path', help='Path to save depth map')
        parser.add_argument('detail_level', type=int, default=50, help='Detail level (0-100)')
        
        args = parser.parse_args()
        
        # Initialize generator
        generator = DetailedDepthGenerator()
        
        # Load image
        image = generator.load_image(args.input_image)
        
        # Generate depth map
        with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
            depth_map = generator.generate_depth_map(image, args.detail_level)
        
        # Convert to 8-bit and save
        depth_8bit = (depth_map * 255).astype(np.uint8)
        cv2.imwrite(args.output_path, depth_8bit)
        
        # Return success result as JSON
        result = {
            "success": True,
            "input_image": args.input_image,
            "output_path": args.output_path,
            "detail_level": args.detail_level,
            "model_used": "detailed",
            "output_size": depth_map.shape,
            "message": "Detailed depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image if 'args' in locals() else "unknown",
            "message": "Failed to generate detailed depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
