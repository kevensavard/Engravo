#!/usr/bin/env python3
"""
SculptOK Sharp Depth Map Generator
=================================

Creates sharp, detailed depth maps with proper white-to-black contrast
while preserving facial features and details like SculptOK.

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

class SculptOKSharpGenerator:
    """
    SculptOK sharp depth map generator.
    Creates sharp, detailed depth maps with proper contrast.
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
        """Generate sharp SculptOK-style depth map."""
        print("=" * 50, file=sys.stderr)
        print("GENERATING SHARP SCULPTOK DEPTH MAP", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        # Step 1: Load image
        print("Step 1: Loading image...", file=sys.stderr)
        image = self.load_image(image_path)
        
        # Step 2: Get AI depth estimation
        print("Step 2: Getting AI depth estimation...", file=sys.stderr)
        ai_depth = self._get_ai_depth(image)
        
        # Step 3: Create sharp depth base
        print("Step 3: Creating sharp depth base...", file=sys.stderr)
        sharp_depth = self._create_sharp_depth_base(image, ai_depth, detail_level)
        
        # Step 4: Apply SculptOK-style processing
        print("Step 4: Applying SculptOK-style processing...", file=sys.stderr)
        sculptok_depth = self._apply_sculptok_processing(sharp_depth, detail_level)
        
        # Step 5: Final sharpening and contrast
        print("Step 5: Final sharpening and contrast...", file=sys.stderr)
        final_depth = self._final_sharp_processing(sculptok_depth)
        
        # Save as 8-bit PNG
        self._save_depth_map(final_depth, output_path)
        
        print("=" * 50, file=sys.stderr)
        print("SHARP SCULPTOK DEPTH MAP COMPLETED", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        return final_depth
    
    def _get_ai_depth(self, image: np.ndarray) -> np.ndarray:
        """Get AI depth estimation."""
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
        
        # Multi-method approach
        brightness_depth = gray.astype(np.float32) / 255.0
        
        # Edge-based depth
        edges = cv2.Canny(gray, 50, 150)
        edge_depth = (255 - edges).astype(np.float32) / 255.0
        
        # Distance transform
        binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        dist_transform = cv2.distanceTransform(binary, cv2.DIST_L2, 5)
        dist_depth = (dist_transform / dist_transform.max()).astype(np.float32)
        
        # Combine methods
        depth = (
            0.5 * brightness_depth +
            0.3 * edge_depth +
            0.2 * dist_depth
        )
        
        # Normalize
        depth = (depth - depth.min()) / (depth.max() - depth.min())
        
        return depth
    
    def _create_sharp_depth_base(self, image: np.ndarray, ai_depth: np.ndarray, detail_level: int) -> np.ndarray:
        """Create sharp depth base with preserved details."""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        detail_weight = detail_level / 100.0
        
        # Start with AI depth as base
        sharp_depth = ai_depth.copy()
        
        # Add sharp detail enhancement based on detail level
        if detail_weight > 0.3:
            # Extract high-frequency details
            blurred = cv2.GaussianBlur(gray, (3, 3), 0)
            details = gray.astype(np.float32) - blurred.astype(np.float32)
            details = np.absolute(details)
            
            # Normalize details
            if details.max() > 0:
                details = details / details.max()
            
            # Enhance depth map with sharp details
            detail_enhancement = 0.1 + detail_weight * 0.4
            sharp_depth = sharp_depth + details * detail_enhancement
        
        # Apply sharpening filter
        kernel_sharp = np.array([[-1, -1, -1],
                                [-1,  9, -1],
                                [-1, -1, -1]])
        
        # Convert to 8-bit for filtering
        depth_8bit = (sharp_depth * 255).astype(np.uint8)
        sharpened = cv2.filter2D(depth_8bit, -1, kernel_sharp)
        
        # Blend original and sharpened based on detail level
        blend_factor = detail_weight * 0.7
        final_sharp = (1 - blend_factor) * sharp_depth + blend_factor * (sharpened.astype(np.float32) / 255.0)
        
        return np.clip(final_sharp, 0, 1)
    
    def _apply_sculptok_processing(self, depth: np.ndarray, detail_level: int) -> np.ndarray:
        """Apply SculptOK-style processing."""
        detail_weight = detail_level / 100.0
        
        # Apply minimal smoothing only if detail level is low
        if detail_weight < 0.7:
            # Light smoothing for low detail levels
            smoothing_amount = (1 - detail_weight) * 2
            kernel_size = max(3, int(smoothing_amount * 5))
            if kernel_size % 2 == 0:
                kernel_size += 1
            
            depth = cv2.GaussianBlur(depth, (kernel_size, kernel_size), smoothing_amount)
        
        # Apply contrast enhancement for SculptOK effect
        # Use histogram equalization for better contrast
        depth_8bit = (depth * 255).astype(np.uint8)
        
        # Apply CLAHE for local contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(depth_8bit)
        
        return enhanced.astype(np.float32) / 255.0
    
    def _final_sharp_processing(self, depth: np.ndarray) -> np.ndarray:
        """Final sharp processing for SculptOK effect."""
        # Apply strong contrast enhancement
        # Stretch histogram to full range
        min_val = depth.min()
        max_val = depth.max()
        
        if max_val > min_val:
            depth_stretched = (depth - min_val) / (max_val - min_val)
        else:
            depth_stretched = depth.copy()
        
        # Apply gamma correction for better depth perception
        gamma = 0.7  # Moderate gamma for SculptOK effect
        depth_gamma = np.power(depth_stretched, gamma)
        
        # Apply S-curve for better contrast
        x = (depth_gamma - 0.5) * 3  # Scale for sigmoid
        s_curve = 1 / (1 + np.exp(-x))
        
        # Apply unsharp masking for final sharpening
        gaussian = cv2.GaussianBlur(s_curve, (3, 3), 0)
        unsharp_mask = cv2.addWeighted(s_curve, 1.8, gaussian, -0.8, 0)
        
        # Ensure full range usage
        final_depth = (unsharp_mask - unsharp_mask.min()) / (unsharp_mask.max() - unsharp_mask.min())
        
        # Apply final contrast boost to ensure white and black
        final_depth = np.clip(final_depth * 1.3 - 0.15, 0, 1)
        
        return final_depth
    
    def _save_depth_map(self, depth: np.ndarray, output_path: str):
        """Save depth map as 8-bit PNG."""
        # Convert to 8-bit
        depth_8bit = (depth * 255).astype(np.uint8)
        
        # Save as PNG
        cv2.imwrite(output_path, depth_8bit)
        
        print(f"Sharp SculptOK depth map saved to: {output_path}", file=sys.stderr)

def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description='Generate sharp SculptOK depth map')
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
        generator = SculptOKSharpGenerator(device=args.device, model_type=args.model)
        
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
            "message": "Sharp SculptOK depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image,
            "message": "Failed to generate sharp SculptOK depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
