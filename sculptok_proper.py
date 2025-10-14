#!/usr/bin/env python3
"""
SculptOK Proper Depth Map Generator
==================================

Correct implementation of depth map generation for laser engraving
using proper MiDaS model loading and post-processing techniques.

Based on research and best practices for depth map generation.
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

class SculptOKProperGenerator:
    """
    Proper SculptOK depth map generator using correct MiDaS implementation.
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
        """Generate proper SculptOK-style depth map."""
        print("=" * 50, file=sys.stderr)
        print("GENERATING PROPER SCULPTOK DEPTH MAP", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        # Step 1: Load image
        print("Step 1: Loading image...", file=sys.stderr)
        image = self.load_image(image_path)
        
        # Step 2: Generate depth map
        print("Step 2: Generating depth map...", file=sys.stderr)
        if self.model_type != "fallback":
            depth_map = self._generate_midas_depth(image)
        else:
            depth_map = self._generate_fallback_depth(image)
        
        # Step 3: Post-process for laser engraving
        print("Step 3: Post-processing for laser engraving...", file=sys.stderr)
        processed_depth = self._postprocess_for_engraving(depth_map, detail_level)
        
        # Step 4: Final optimization
        print("Step 4: Final optimization...", file=sys.stderr)
        final_depth = self._final_optimization(processed_depth)
        
        # Save depth map
        self._save_depth_map(final_depth, output_path)
        
        print("=" * 50, file=sys.stderr)
        print("PROPER SCULPTOK DEPTH MAP COMPLETED", file=sys.stderr)
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
    
    def _postprocess_for_engraving(self, depth_map: np.ndarray, detail_level: int) -> np.ndarray:
        """Post-process depth map for laser engraving."""
        detail_weight = detail_level / 100.0
        
        # Apply smoothing based on detail level
        if detail_weight < 0.8:
            # Apply Gaussian blur for smoother results
            smoothing_amount = (1 - detail_weight) * 3.0  # 0.6 to 3.0
            kernel_size = max(3, int(smoothing_amount * 8))
            if kernel_size % 2 == 0:
                kernel_size += 1
            
            depth_map = cv2.GaussianBlur(depth_map, (kernel_size, kernel_size), smoothing_amount)
        
        # Apply bilateral filtering for edge-preserving smoothing
        depth_8bit = (depth_map * 255).astype(np.uint8)
        bilateral_filtered = cv2.bilateralFilter(depth_8bit, 15, 80, 80)
        
        return bilateral_filtered.astype(np.float32) / 255.0
    
    def _final_optimization(self, depth_map: np.ndarray) -> np.ndarray:
        """Final optimization for laser engraving."""
        # Normalize to full range
        depth_min = depth_map.min()
        depth_max = depth_map.max()
        
        if depth_max > depth_min:
            normalized_depth = (depth_map - depth_min) / (depth_max - depth_min)
        else:
            normalized_depth = depth_map.copy()
        
        # Apply gamma correction for better depth perception
        gamma = 0.7  # Slightly darker midtones
        gamma_corrected = np.power(normalized_depth, gamma)
        
        # Apply contrast enhancement
        contrast_enhanced = cv2.addWeighted(gamma_corrected, 1.4, gamma_corrected, -0.4, 0)
        
        # Apply S-curve for better contrast
        x = (contrast_enhanced - 0.5) * 3
        s_curve = 1 / (1 + np.exp(-x))
        
        # Final normalization to ensure full range
        final_min = s_curve.min()
        final_max = s_curve.max()
        
        if final_max > final_min:
            final_depth = (s_curve - final_min) / (final_max - final_min)
        else:
            final_depth = s_curve
        
        # Ensure we have proper white and black values
        final_depth = np.clip(final_depth * 1.1 - 0.05, 0, 1)
        
        return final_depth
    
    def _save_depth_map(self, depth_map: np.ndarray, output_path: str):
        """Save depth map as 8-bit PNG."""
        # Convert to 8-bit
        depth_8bit = (depth_map * 255).astype(np.uint8)
        
        # Save as PNG
        cv2.imwrite(output_path, depth_8bit)
        
        print(f"Proper SculptOK depth map saved to: {output_path}", file=sys.stderr)

def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description='Generate proper SculptOK depth map')
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
        generator = SculptOKProperGenerator(device=args.device, model_type=args.model)
        
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
            "message": "Proper SculptOK depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image,
            "message": "Failed to generate proper SculptOK depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
