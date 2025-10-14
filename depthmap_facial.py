#!/usr/bin/env python3
"""
Facial-Optimized Depth Map Generator - Maximum Detail for Faces
==============================================================
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

class FacialDepthGenerator:
    """Facial-optimized depth generator with maximum detail preservation."""
    
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
        if max(h, w) > 1024:
            scale = 1024 / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        return img
    
    def generate_depth_map(self, image: np.ndarray, detail_level: int = 50) -> np.ndarray:
        """Generate facial-optimized depth map."""
        
        # Convert to grayscale
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
                
                # Enhance with facial detail preservation
                depth = self._enhance_facial_depth(depth, gray, detail_level)
                
            except Exception as e:
                # Fall back to facial-optimized traditional method
                depth = self._facial_traditional_depth(gray, detail_level)
        else:
            # Use facial-optimized traditional method
            depth = self._facial_traditional_depth(gray, detail_level)
        
        return depth
    
    def _enhance_facial_depth(self, ai_depth: np.ndarray, gray: np.ndarray, detail_level: int) -> np.ndarray:
        """Enhance AI depth with facial detail preservation."""
        
        detail_weight = detail_level / 100.0
        
        # Create facial detail maps
        facial_features = self._extract_facial_features(gray)
        skin_texture = self._extract_skin_texture(gray)
        edge_details = self._extract_edge_details(gray)
        
        # Combine AI depth with facial details
        enhanced_depth = (
            0.4 * ai_depth +  # AI depth as base
            0.25 * facial_features +  # Facial feature depth
            0.2 * skin_texture +  # Skin texture depth
            0.15 * edge_details  # Edge detail depth
        )
        
        # Apply facial detail enhancement
        if detail_weight > 0.3:
            enhanced_depth = self._preserve_facial_details(enhanced_depth, gray, detail_weight)
        
        return enhanced_depth
    
    def _facial_traditional_depth(self, gray: np.ndarray, detail_level: int) -> np.ndarray:
        """Facial-optimized traditional depth estimation."""
        
        detail_weight = detail_level / 100.0
        
        # Extract facial features
        facial_features = self._extract_facial_features(gray)
        skin_texture = self._extract_skin_texture(gray)
        edge_details = self._extract_edge_details(gray)
        
        # Create additional depth layers
        brightness_depth = gray.astype(np.float32) / 255.0
        gradient_depth = self._create_gradient_depth(gray)
        contrast_depth = self._create_contrast_depth(gray)
        
        # Combine with facial-optimized weights
        depth = (
            0.25 * facial_features +  # Facial features (most important)
            0.2 * brightness_depth +  # Brightness
            0.2 * skin_texture +  # Skin texture
            0.15 * edge_details +  # Edge details
            0.1 * gradient_depth +  # Gradients
            0.1 * contrast_depth  # Local contrast
        )
        
        # Apply facial detail preservation
        if detail_weight > 0.3:
            depth = self._preserve_facial_details(depth, gray, detail_weight)
        
        # Normalize
        depth = (depth - depth.min()) / (depth.max() - depth.min())
        
        return depth
    
    def _extract_facial_features(self, gray: np.ndarray) -> np.ndarray:
        """Extract facial features using edge detection and morphological operations."""
        
        # Multi-scale edge detection for facial features
        edges1 = cv2.Canny(gray, 20, 60)  # Fine features
        edges2 = cv2.Canny(gray, 40, 120)  # Medium features
        edges3 = cv2.Canny(gray, 80, 160)  # Strong features
        
        # Combine edges
        combined_edges = cv2.bitwise_or(edges1, cv2.bitwise_or(edges2, edges3))
        
        # Morphological operations to enhance facial features
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        enhanced_edges = cv2.morphologyEx(combined_edges, cv2.MORPH_CLOSE, kernel)
        
        # Distance transform from edges
        dist_transform = cv2.distanceTransform(255 - enhanced_edges, cv2.DIST_L2, 5)
        facial_depth = (dist_transform / dist_transform.max()).astype(np.float32)
        
        return facial_depth
    
    def _extract_skin_texture(self, gray: np.ndarray) -> np.ndarray:
        """Extract skin texture using local binary patterns and texture analysis."""
        
        # Apply bilateral filter to preserve edges while smoothing
        smoothed = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # Calculate texture variation
        texture = gray.astype(np.float32) - smoothed.astype(np.float32)
        texture = np.absolute(texture)
        
        # Apply local binary pattern-like analysis
        kernel = np.array([[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]])
        texture_response = cv2.filter2D(gray, cv2.CV_64F, kernel)
        texture_response = np.absolute(texture_response)
        
        # Combine texture measures
        combined_texture = (texture + texture_response) / 2
        
        # Normalize
        if combined_texture.max() > 0:
            texture_depth = (combined_texture / combined_texture.max()).astype(np.float32)
        else:
            texture_depth = np.zeros_like(gray, dtype=np.float32)
        
        return texture_depth
    
    def _extract_edge_details(self, gray: np.ndarray) -> np.ndarray:
        """Extract detailed edge information."""
        
        # Multi-directional edge detection
        sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        
        # Gradient magnitude
        gradient_magnitude = np.sqrt(sobel_x**2 + sobel_y**2)
        
        # Laplacian for additional detail
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        laplacian = np.absolute(laplacian)
        
        # Combine gradient and Laplacian
        edge_details = gradient_magnitude + laplacian
        
        # Normalize
        edge_depth = (edge_details / edge_details.max()).astype(np.float32)
        
        return edge_depth
    
    def _create_gradient_depth(self, gray: np.ndarray) -> np.ndarray:
        """Create depth from gradients."""
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        gradient_depth = (gradient_magnitude / gradient_magnitude.max()).astype(np.float32)
        return gradient_depth
    
    def _create_contrast_depth(self, gray: np.ndarray) -> np.ndarray:
        """Create depth from local contrast."""
        kernel = np.ones((9, 9), np.float32) / 81
        mean = cv2.filter2D(gray.astype(np.float32), -1, kernel)
        squared = cv2.filter2D((gray.astype(np.float32))**2, -1, kernel)
        variance = squared - mean**2
        std_dev = np.sqrt(np.maximum(variance, 0))
        contrast_depth = (std_dev / std_dev.max()).astype(np.float32)
        return contrast_depth
    
    def _preserve_facial_details(self, depth: np.ndarray, gray: np.ndarray, detail_weight: float) -> np.ndarray:
        """Preserve facial details with aggressive detail enhancement."""
        
        # Extract high-frequency details
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        details = gray.astype(np.float32) - blurred.astype(np.float32)
        details = np.absolute(details)
        
        # Normalize details
        if details.max() > 0:
            details = details / details.max()
        
        # Apply aggressive sharpening for facial features
        kernel_sharp = np.array([[-1, -1, -1],
                                [-1, 12, -1],
                                [-1, -1, -1]])
        
        # Convert to 8-bit for filtering
        depth_8bit = (depth * 255).astype(np.uint8)
        sharpened = cv2.filter2D(depth_8bit, -1, kernel_sharp)
        
        # Apply unsharp masking
        gaussian = cv2.GaussianBlur(depth_8bit, (3, 3), 0)
        unsharp_mask = cv2.addWeighted(depth_8bit, 1.5, gaussian, -0.5, 0)
        
        # Blend based on detail weight
        detail_enhancement = 0.2 + detail_weight * 0.6
        enhanced_depth = depth + details * detail_enhancement
        
        # Final blending
        blend_factor = detail_weight * 0.7
        final_depth = (
            (1 - blend_factor) * enhanced_depth + 
            blend_factor * 0.6 * (sharpened.astype(np.float32) / 255.0) +
            blend_factor * 0.4 * (unsharp_mask.astype(np.float32) / 255.0)
        )
        
        return np.clip(final_depth, 0, 1)

def main():
    """Main function - only outputs JSON."""
    try:
        parser = argparse.ArgumentParser(description='Generate facial-optimized depth map')
        parser.add_argument('input_image', help='Path to input image')
        parser.add_argument('output_path', help='Path to save depth map')
        parser.add_argument('detail_level', type=int, default=50, help='Detail level (0-100)')
        
        args = parser.parse_args()
        
        # Initialize generator
        generator = FacialDepthGenerator()
        
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
            "model_used": "facial",
            "output_size": depth_map.shape,
            "message": "Facial-optimized depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image if 'args' in locals() else "unknown",
            "message": "Failed to generate facial-optimized depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
