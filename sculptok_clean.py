#!/usr/bin/env python3
"""
SculptOK Clean Depth Map Generator
=================================

Creates clean, smooth depth maps with proper white-to-black gradients
like SculptOK produces - no grain, no texture, just smooth depth.

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
import torch

# Suppress warnings
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
os.environ['HF_HUB_DISABLE_PROGRESS_BARS'] = '1'

# Redirect output during imports
from contextlib import redirect_stdout, redirect_stderr

class DevNull:
    def write(self, x): pass
    def flush(self): pass

# Suppress imports
sys.stdout = DevNull()
sys.stderr = DevNull()

try:
    from transformers import pipeline
    MIDAS_AVAILABLE = True
except ImportError:
    MIDAS_AVAILABLE = False

# Restore stdout/stderr
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__

class SculptOKCleanGenerator:
    """
    SculptOK clean depth map generator.
    Creates smooth, clean depth maps with proper gradients.
    """
    
    def __init__(self, device="auto", model_type="midas"):
        """Initialize the depth generator."""
        self.device = self._get_device(device)
        self.model_type = model_type
        self.depth_estimator = None
        self._load_model()
    
    def _get_device(self, device):
        """Determine the best available device."""
        if device == "auto":
            if torch.cuda.is_available():
                return "cuda"
            else:
                return "cpu"
        return device
    
    def _load_model(self):
        """Load the depth estimation model."""
        print(f"Loading {self.model_type} model on {self.device}...", file=sys.stderr)
        
        if self.model_type == "midas" and MIDAS_AVAILABLE:
            try:
                with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
                    self.depth_estimator = pipeline(
                        "depth-estimation", 
                        model="Intel/dpt-large",
                        device=0 if self.device == "cuda" else -1
                    )
                print("MiDaS model loaded successfully", file=sys.stderr)
            except Exception as e:
                print(f"Failed to load MiDaS: {e}", file=sys.stderr)
                self.model_type = "fallback"
        
        if self.model_type == "fallback":
            print("Using fallback depth estimation", file=sys.stderr)
    
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
        """Generate clean SculptOK-style depth map."""
        print("=" * 50, file=sys.stderr)
        print("GENERATING CLEAN SCULPTOK DEPTH MAP", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        # Step 1: Load image
        print("Step 1: Loading image...", file=sys.stderr)
        image = self.load_image(image_path)
        
        # Step 2: Get clean AI depth
        print("Step 2: Getting clean AI depth...", file=sys.stderr)
        clean_depth = self._get_clean_ai_depth(image)
        
        # Step 3: Apply smooth processing
        print("Step 3: Applying smooth processing...", file=sys.stderr)
        smooth_depth = self._apply_smooth_processing(clean_depth, detail_level)
        
        # Step 4: Create clean gradients
        print("Step 4: Creating clean gradients...", file=sys.stderr)
        gradient_depth = self._create_clean_gradients(smooth_depth)
        
        # Step 5: Final clean processing
        print("Step 5: Final clean processing...", file=sys.stderr)
        final_depth = self._final_clean_processing(gradient_depth)
        
        # Save as 8-bit PNG
        self._save_depth_map(final_depth, output_path)
        
        print("=" * 50, file=sys.stderr)
        print("CLEAN SCULPTOK DEPTH MAP COMPLETED", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        return final_depth
    
    def _get_clean_ai_depth(self, image: np.ndarray) -> np.ndarray:
        """Get clean AI depth estimation."""
        if self.depth_estimator is not None and self.model_type != "fallback":
            try:
                # Convert to PIL for transformers
                pil_image = Image.fromarray(image)
                
                with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
                    result = self.depth_estimator(pil_image)
                
                depth = np.array(result['depth'])
                
                # Normalize to 0-1
                depth = (depth - depth.min()) / (depth.max() - depth.min())
                
                # Invert for laser engraving (brighter = closer)
                depth = 1.0 - depth
                
                return depth
                
            except Exception as e:
                print(f"AI depth estimation failed: {e}, using fallback", file=sys.stderr)
                return self._fallback_depth_estimation(image)
        else:
            return self._fallback_depth_estimation(image)
    
    def _fallback_depth_estimation(self, image: np.ndarray) -> np.ndarray:
        """Fallback depth estimation."""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Simple brightness-based depth
        brightness_depth = gray.astype(np.float32) / 255.0
        
        # Apply light smoothing for clean results
        smoothed = cv2.GaussianBlur(brightness_depth, (5, 5), 1.0)
        
        return smoothed
    
    def _apply_smooth_processing(self, depth: np.ndarray, detail_level: int) -> np.ndarray:
        """Apply smooth processing to remove grain and texture."""
        detail_weight = detail_level / 100.0
        
        # Apply heavy smoothing to remove grain and texture
        # The more detail, the less smoothing
        smoothing_amount = 2.0 - (detail_weight * 1.5)  # 0.5 to 2.0
        
        # Apply Gaussian blur for smooth results
        kernel_size = int(smoothing_amount * 10) * 2 + 1  # Ensure odd
        kernel_size = max(5, min(kernel_size, 51))  # Clamp between 5 and 51
        
        smoothed = cv2.GaussianBlur(depth, (kernel_size, kernel_size), smoothing_amount)
        
        # Apply bilateral filtering for edge-preserving smoothing
        depth_8bit = (smoothed * 255).astype(np.uint8)
        bilateral_smoothed = cv2.bilateralFilter(depth_8bit, 25, 100, 100)
        
        return bilateral_smoothed.astype(np.float32) / 255.0
    
    def _create_clean_gradients(self, depth: np.ndarray) -> np.ndarray:
        """Create clean, smooth gradients."""
        # Apply median filter to remove any remaining noise
        depth_8bit = (depth * 255).astype(np.uint8)
        median_filtered = cv2.medianBlur(depth_8bit, 5)
        
        # Apply additional smoothing for ultra-clean results
        ultra_smooth = cv2.GaussianBlur(median_filtered, (9, 9), 2.0)
        
        return ultra_smooth.astype(np.float32) / 255.0
    
    def _final_clean_processing(self, depth: np.ndarray) -> np.ndarray:
        """Final clean processing for SculptOK effect."""
        # Apply histogram stretching for full range
        min_val = depth.min()
        max_val = depth.max()
        
        if max_val > min_val:
            depth_stretched = (depth - min_val) / (max_val - min_val)
        else:
            depth_stretched = depth.copy()
        
        # Apply gentle gamma correction
        gamma = 0.8
        depth_gamma = np.power(depth_stretched, gamma)
        
        # Apply gentle contrast enhancement
        depth_enhanced = cv2.addWeighted(depth_gamma, 1.3, depth_gamma, -0.3, 0)
        
        # Final smoothing for ultra-clean results
        final_smooth = cv2.GaussianBlur(depth_enhanced, (3, 3), 1.0)
        
        # Ensure full range usage
        final_depth = (final_smooth - final_smooth.min()) / (final_smooth.max() - final_smooth.min())
        
        # Apply gentle contrast boost
        final_depth = np.clip(final_depth * 1.1 - 0.05, 0, 1)
        
        return final_depth
    
    def _save_depth_map(self, depth: np.ndarray, output_path: str):
        """Save depth map as 8-bit PNG."""
        # Convert to 8-bit
        depth_8bit = (depth * 255).astype(np.uint8)
        
        # Save as PNG
        cv2.imwrite(output_path, depth_8bit)
        
        print(f"Clean SculptOK depth map saved to: {output_path}", file=sys.stderr)

def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description='Generate clean SculptOK depth map')
    parser.add_argument('input_image', help='Path to input image')
    parser.add_argument('output_path', help='Path to save depth map')
    parser.add_argument('detail_level', type=int, default=50, help='Detail level (0-100)')
    parser.add_argument('--model', choices=['midas', 'fallback'], 
                       default='midas', help='Depth estimation model')
    parser.add_argument('--device', choices=['auto', 'cpu', 'cuda'], 
                       default='auto', help='Device to use')
    
    args = parser.parse_args()
    
    try:
        # Initialize generator
        generator = SculptOKCleanGenerator(device=args.device, model_type=args.model)
        
        # Generate depth map
        with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
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
            "model_used": args.model,
            "output_size": depth_map.shape,
            "message": "Clean SculptOK depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image,
            "message": "Failed to generate clean SculptOK depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
