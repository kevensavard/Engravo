#!/usr/bin/env python3
"""
SculptOK Simple Fix Depth Map Generator
======================================

Simple approach that creates proper depth gradients
without complex kernel operations that cause issues.

Author: AI Assistant
License: MIT
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

# Suppress warnings
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

class SculptOKSimpleFixGenerator:
    """
    SculptOK simple fix depth map generator.
    Creates proper depth gradients without complex operations.
    """
    
    def __init__(self):
        """Initialize the depth generator."""
        pass
    
    def load_image(self, image_path: str) -> np.ndarray:
        """Load and preprocess image."""
        # Load image
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
    
    def generate_depthmap(self, image_path: str, output_path: str, 
                         detail_level: int = 50) -> np.ndarray:
        """Generate SculptOK-style depth map with simple approach."""
        print("=" * 50, file=sys.stderr)
        print("GENERATING SCULPTOK SIMPLE FIX DEPTH MAP", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        # Step 1: Load image
        print("Step 1: Loading image...", file=sys.stderr)
        image = self.load_image(image_path)
        
        # Step 2: Create depth map
        print("Step 2: Creating depth map...", file=sys.stderr)
        depth_map = self._create_simple_depth(image, detail_level)
        
        # Step 3: Apply contrast enhancement
        print("Step 3: Applying contrast enhancement...", file=sys.stderr)
        enhanced_depth = self._enhance_contrast(depth_map, detail_level)
        
        # Step 4: Apply final optimization
        print("Step 4: Applying final optimization...", file=sys.stderr)
        final_depth = self._final_optimization(enhanced_depth, detail_level)
        
        # Save depth map
        self._save_depth_map(final_depth, output_path)
        
        print("=" * 50, file=sys.stderr)
        print("SCULPTOK SIMPLE FIX DEPTH MAP COMPLETED", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        return final_depth
    
    def _create_simple_depth(self, image: np.ndarray, detail_level: int) -> np.ndarray:
        """Create simple depth map."""
        detail_weight = detail_level / 100.0
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Create depth map based on brightness
        brightness = gray.astype(np.float32) / 255.0
        
        # Apply different processing based on detail level
        if detail_weight > 0.7:
            # High detail: preserve texture
            depth_map = brightness.copy()
            
            # Add edge enhancement
            edges = cv2.Canny(gray, 50, 150)
            edge_mask = (255 - edges).astype(np.float32) / 255.0
            depth_map = depth_map * 0.8 + edge_mask * 0.2
            
        else:
            # Low detail: create smooth gradients
            # Apply Gaussian blur for smoothness
            blurred = cv2.GaussianBlur(gray, (15, 15), 0)
            depth_map = blurred.astype(np.float32) / 255.0
            
            # Apply additional smoothing for sculptural effect
            if detail_weight < 0.5:
                depth_map = cv2.GaussianBlur(depth_map, (21, 21), 0)
        
        return depth_map
    
    def _enhance_contrast(self, depth_map: np.ndarray, detail_level: int) -> np.ndarray:
        """Enhance contrast for better depth perception."""
        detail_weight = detail_level / 100.0
        
        # Apply histogram stretching to ensure full range
        p2, p98 = np.percentile(depth_map, [2, 98])
        if p98 > p2:
            stretched = (depth_map - p2) / (p98 - p2)
        else:
            stretched = depth_map
        
        # Apply gamma correction
        gamma = 0.6 + (1 - detail_weight) * 0.2  # 0.6 to 0.8
        gamma_corrected = np.power(stretched, gamma)
        
        # Apply contrast enhancement
        contrast_strength = 1.5 + detail_weight * 0.5  # 1.5 to 2.0
        contrast_enhanced = cv2.addWeighted(gamma_corrected, contrast_strength, gamma_corrected, -(contrast_strength - 1), 0)
        
        return np.clip(contrast_enhanced, 0, 1)
    
    def _final_optimization(self, depth_map: np.ndarray, detail_level: int) -> np.ndarray:
        """Apply final optimization."""
        detail_weight = detail_level / 100.0
        
        # Apply S-curve for better contrast
        x = (depth_map - 0.5) * 4  # Scale for sigmoid
        s_curve = 1 / (1 + np.exp(-x))
        
        # Apply final contrast boost
        final_boost = 1.3 + detail_weight * 0.4  # 1.3 to 1.7
        final_depth = np.clip(s_curve * final_boost - (final_boost - 1) / 2, 0, 1)
        
        # Final normalization to ensure full range
        final_min = final_depth.min()
        final_max = final_depth.max()
        
        if final_max > final_min:
            final_depth = (final_depth - final_min) / (final_max - final_min)
        
        return final_depth
    
    def _save_depth_map(self, depth_map: np.ndarray, output_path: str):
        """Save depth map as 8-bit PNG."""
        # Convert to 8-bit
        depth_8bit = (depth_map * 255).astype(np.uint8)
        
        # Save as PNG
        cv2.imwrite(output_path, depth_8bit)
        
        print(f"SculptOK Simple Fix depth map saved to: {output_path}", file=sys.stderr)

def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description='Generate SculptOK Simple Fix depth map')
    parser.add_argument('input_image', help='Path to input image')
    parser.add_argument('output_path', help='Path to save depth map')
    parser.add_argument('detail_level', type=int, default=50, help='Detail level (25, 50, or 100)')
    
    args = parser.parse_args()
    
    try:
        # Initialize generator
        generator = SculptOKSimpleFixGenerator()
        
        # Generate depth map
        depth_map = generator.generate_depthmap(
            args.input_image, 
            args.output_path,
            detail_level=args.detail_level
        )
        
        # Return success result as JSON
        result = {
            "success": True,
            "input_image": args.input_image,
            "output_path": args.output_path,
            "detail_level": args.detail_level,
            "model_used": "Simple",
            "output_size": depth_map.shape,
            "message": "SculptOK Simple Fix depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image,
            "message": "Failed to generate SculptOK Simple Fix depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
