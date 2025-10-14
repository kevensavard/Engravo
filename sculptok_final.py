#!/usr/bin/env python3
"""
SculptOK Final Depth Map Generator
=================================

Creates sharp, detailed depth maps with proper contrast
that match SculptOK quality - no excessive blurring.

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
import torch.nn.functional as F

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
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

# Restore stdout/stderr
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__

class SculptOKFinalGenerator:
    """
    Final SculptOK depth map generator with sharp, detailed results.
    """
    
    def __init__(self, device="auto", model_type="DPT_Large"):
        """Initialize the depth generator."""
        self.device = self._get_device(device)
        self.model_type = model_type
        self.model = None
        self.transform = None
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
        """Load the MiDaS model properly."""
        if not TORCH_AVAILABLE:
            print("PyTorch not available, using fallback", file=sys.stderr)
            self.model_type = "fallback"
            return
        
        print(f"Loading {self.model_type} model on {self.device}...", file=sys.stderr)
        
        try:
            # Load MiDaS model properly
            with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
                self.model = torch.hub.load("intel-isl/MiDaS", self.model_type)
                self.model.to(self.device)
                self.model.eval()
                
                # Load the correct transform
                midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
                
                if self.model_type == "DPT_Large":
                    self.transform = midas_transforms.dpt_transform
                else:
                    self.transform = midas_transforms.small_transform
            
            print(f"{self.model_type} model loaded successfully", file=sys.stderr)
            
        except Exception as e:
            print(f"Failed to load MiDaS model: {e}", file=sys.stderr)
            self.model_type = "fallback"
    
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
        
        # Step 2: Generate base depth
        print("Step 2: Generating base depth...", file=sys.stderr)
        if self.model_type != "fallback":
            base_depth = self._generate_midas_depth(image)
        else:
            base_depth = self._generate_fallback_depth(image)
        
        # Step 3: Enhance with sharp details
        print("Step 3: Enhancing with sharp details...", file=sys.stderr)
        enhanced_depth = self._enhance_sharp_details(base_depth, image, detail_level)
        
        # Step 4: Apply SculptOK-style processing
        print("Step 4: Applying SculptOK-style processing...", file=sys.stderr)
        sculptok_depth = self._apply_sculptok_style(enhanced_depth, detail_level)
        
        # Step 5: Final sharp optimization
        print("Step 5: Final sharp optimization...", file=sys.stderr)
        final_depth = self._final_sharp_optimization(sculptok_depth)
        
        # Save depth map
        self._save_depth_map(final_depth, output_path)
        
        print("=" * 50, file=sys.stderr)
        print("SHARP SCULPTOK DEPTH MAP COMPLETED", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        return final_depth
    
    def _generate_midas_depth(self, image: np.ndarray) -> np.ndarray:
        """Generate depth map using MiDaS model."""
        try:
            # Convert to PIL Image
            pil_image = Image.fromarray(image)
            
            # Apply transform
            input_tensor = self.transform(pil_image).to(self.device)
            
            # Predict depth
            with torch.no_grad():
                prediction = self.model(input_tensor)
                
                # Interpolate to original size
                prediction = F.interpolate(
                    prediction.unsqueeze(1),
                    size=image.shape[:2],
                    mode="bicubic",
                    align_corners=False,
                ).squeeze()
            
            # Convert to numpy
            depth_map = prediction.cpu().numpy()
            
            # Normalize depth map
            depth_min = depth_map.min()
            depth_max = depth_map.max()
            normalized_depth = (depth_map - depth_min) / (depth_max - depth_min)
            
            # Invert for laser engraving (brighter = closer)
            inverted_depth = 1.0 - normalized_depth
            
            return inverted_depth
            
        except Exception as e:
            print(f"MiDaS depth generation failed: {e}", file=sys.stderr)
            return self._generate_fallback_depth(image)
    
    def _generate_fallback_depth(self, image: np.ndarray) -> np.ndarray:
        """Generate fallback depth map using traditional methods."""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Brightness-based depth
        brightness_depth = gray.astype(np.float32) / 255.0
        
        # Edge-based depth
        edges = cv2.Canny(gray, 50, 150)
        edge_depth = (255 - edges).astype(np.float32) / 255.0
        
        # Distance transform
        binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        dist_transform = cv2.distanceTransform(binary, cv2.DIST_L2, 5)
        dist_depth = (dist_transform / dist_transform.max()).astype(np.float32)
        
        # Combine methods
        combined_depth = (
            0.5 * brightness_depth +
            0.3 * edge_depth +
            0.2 * dist_depth
        )
        
        # Normalize
        combined_depth = (combined_depth - combined_depth.min()) / (combined_depth.max() - combined_depth.min())
        
        return combined_depth
    
    def _enhance_sharp_details(self, base_depth: np.ndarray, image: np.ndarray, detail_level: int) -> np.ndarray:
        """Enhance depth map with sharp details."""
        detail_weight = detail_level / 100.0
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Extract high-frequency details
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        details = gray.astype(np.float32) - blurred.astype(np.float32)
        details = np.absolute(details)
        
        # Normalize details
        if details.max() > 0:
            details = details / details.max()
        
        # Create edge-based enhancement
        edges = cv2.Canny(gray, 30, 100)
        edge_enhancement = (255 - edges).astype(np.float32) / 255.0
        
        # Combine base depth with sharp details
        detail_enhancement = 0.05 + detail_weight * 0.25
        edge_enhancement_weight = 0.05 + detail_weight * 0.15
        
        enhanced_depth = (
            base_depth +
            details * detail_enhancement +
            edge_enhancement * edge_enhancement_weight
        )
        
        return np.clip(enhanced_depth, 0, 1)
    
    def _apply_sculptok_style(self, depth_map: np.ndarray, detail_level: int) -> np.ndarray:
        """Apply SculptOK-style processing with minimal blurring."""
        detail_weight = detail_level / 100.0
        
        # Apply minimal smoothing only for very low detail levels
        if detail_weight < 0.3:
            # Light smoothing only
            depth_map = cv2.GaussianBlur(depth_map, (3, 3), 0.5)
        
        # Apply contrast enhancement
        depth_8bit = (depth_map * 255).astype(np.uint8)
        
        # Apply CLAHE for local contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(depth_8bit)
        
        return enhanced.astype(np.float32) / 255.0
    
    def _final_sharp_optimization(self, depth_map: np.ndarray) -> np.ndarray:
        """Final sharp optimization for SculptOK effect."""
        # Normalize to full range
        depth_min = depth_map.min()
        depth_max = depth_map.max()
        
        if depth_max > depth_min:
            normalized_depth = (depth_map - depth_min) / (depth_max - depth_min)
        else:
            normalized_depth = depth_map.copy()
        
        # Apply gamma correction for better depth perception
        gamma = 0.8  # Moderate gamma
        gamma_corrected = np.power(normalized_depth, gamma)
        
        # Apply sharp contrast enhancement
        contrast_enhanced = cv2.addWeighted(gamma_corrected, 1.6, gamma_corrected, -0.6, 0)
        
        # Apply unsharp masking for sharpening
        gaussian = cv2.GaussianBlur(contrast_enhanced, (3, 3), 0)
        unsharp_mask = cv2.addWeighted(contrast_enhanced, 2.0, gaussian, -1.0, 0)
        
        # Final normalization
        final_min = unsharp_mask.min()
        final_max = unsharp_mask.max()
        
        if final_max > final_min:
            final_depth = (unsharp_mask - final_min) / (final_max - final_min)
        else:
            final_depth = unsharp_mask
        
        # Apply final contrast boost
        final_depth = np.clip(final_depth * 1.2 - 0.1, 0, 1)
        
        return final_depth
    
    def _save_depth_map(self, depth_map: np.ndarray, output_path: str):
        """Save depth map as 8-bit PNG."""
        # Convert to 8-bit
        depth_8bit = (depth_map * 255).astype(np.uint8)
        
        # Save as PNG
        cv2.imwrite(output_path, depth_8bit)
        
        print(f"Sharp SculptOK depth map saved to: {output_path}", file=sys.stderr)

def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description='Generate sharp SculptOK depth map')
    parser.add_argument('input_image', help='Path to input image')
    parser.add_argument('output_path', help='Path to save depth map')
    parser.add_argument('detail_level', type=int, default=50, help='Detail level (0-100)')
    parser.add_argument('--model', choices=['DPT_Large', 'MiDaS_small', 'fallback'], 
                       default='DPT_Large', help='MiDaS model type')
    parser.add_argument('--device', choices=['auto', 'cpu', 'cuda'], 
                       default='auto', help='Device to use')
    
    args = parser.parse_args()
    
    try:
        # Initialize generator
        generator = SculptOKFinalGenerator(device=args.device, model_type=args.model)
        
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
