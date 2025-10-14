#!/usr/bin/env python3
"""
SculptOK Contrast Depth Map Generator
====================================

Creates depth maps with proper white-to-black contrast and smooth gradients
for laser engraving - faces white, background black, smooth transitions.

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

class SculptOKContrastGenerator:
    """
    SculptOK contrast-focused depth map generator.
    Creates proper white-to-black contrast with smooth gradients.
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
        """Generate contrast-focused SculptOK depth map."""
        print("=" * 50, file=sys.stderr)
        print("GENERATING CONTRAST SCULPTOK DEPTH MAP", file=sys.stderr)
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
        
        # Step 3: Create smooth gradients
        print("Step 3: Creating smooth gradients...", file=sys.stderr)
        smooth_depth = self._create_smooth_gradients(base_depth, image, detail_level)
        
        # Step 4: Apply contrast enhancement
        print("Step 4: Applying contrast enhancement...", file=sys.stderr)
        contrast_depth = self._apply_contrast_enhancement(smooth_depth)
        
        # Step 5: Final optimization
        print("Step 5: Final optimization...", file=sys.stderr)
        final_depth = self._final_contrast_optimization(contrast_depth)
        
        # Save depth map
        self._save_depth_map(final_depth, output_path)
        
        print("=" * 50, file=sys.stderr)
        print("CONTRAST SCULPTOK DEPTH MAP COMPLETED", file=sys.stderr)
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
    
    def _create_smooth_gradients(self, base_depth: np.ndarray, image: np.ndarray, detail_level: int) -> np.ndarray:
        """Create smooth gradients for better depth perception."""
        detail_weight = detail_level / 100.0
        
        # Apply smoothing based on detail level
        if detail_weight < 0.8:
            # Apply Gaussian blur for smoother gradients
            smoothing_amount = (1 - detail_weight) * 4.0  # 0.8 to 4.0
            kernel_size = max(5, int(smoothing_amount * 8))
            if kernel_size % 2 == 0:
                kernel_size += 1
            
            # Apply Gaussian blur for smooth gradients
            smoothed = cv2.GaussianBlur(base_depth, (kernel_size, kernel_size), smoothing_amount)
            
            # Apply bilateral filtering for edge-preserving smoothing
            depth_8bit = (smoothed * 255).astype(np.uint8)
            bilateral_smoothed = cv2.bilateralFilter(depth_8bit, 25, 100, 100)
            
            return bilateral_smoothed.astype(np.float32) / 255.0
        else:
            # For high detail, apply light smoothing only
            light_smoothed = cv2.GaussianBlur(base_depth, (3, 3), 1.0)
            return light_smoothed
    
    def _apply_contrast_enhancement(self, depth_map: np.ndarray) -> np.ndarray:
        """Apply strong contrast enhancement for white-to-black range."""
        # Normalize to full range first
        depth_min = depth_map.min()
        depth_max = depth_map.max()
        
        if depth_max > depth_min:
            normalized_depth = (depth_map - depth_min) / (depth_max - depth_min)
        else:
            normalized_depth = depth_map.copy()
        
        # Apply strong gamma correction for better contrast
        gamma = 0.6  # Strong gamma for more contrast
        gamma_corrected = np.power(normalized_depth, gamma)
        
        # Apply S-curve for dramatic contrast enhancement
        x = (gamma_corrected - 0.5) * 4  # Scale for sigmoid
        s_curve = 1 / (1 + np.exp(-x))
        
        # Apply additional contrast enhancement
        contrast_enhanced = cv2.addWeighted(s_curve, 2.0, s_curve, -1.0, 0)
        
        return np.clip(contrast_enhanced, 0, 1)
    
    def _final_contrast_optimization(self, depth_map: np.ndarray) -> np.ndarray:
        """Final optimization to ensure proper white-to-black contrast."""
        # Apply histogram stretching to use full range
        p2, p98 = np.percentile(depth_map, [2, 98])
        
        # Stretch histogram to use full range
        if p98 > p2:
            stretched = (depth_map - p2) / (p98 - p2)
        else:
            stretched = depth_map.copy()
        
        # Apply final contrast boost to ensure white and black
        final_depth = np.clip(stretched * 1.3 - 0.15, 0, 1)
        
        # Apply gentle smoothing for ultra-smooth gradients
        final_smooth = cv2.GaussianBlur(final_depth, (3, 3), 1.0)
        
        # Ensure we have proper white and black values
        final_min = final_smooth.min()
        final_max = final_smooth.max()
        
        if final_max > final_min:
            final_depth = (final_smooth - final_min) / (final_max - final_min)
        else:
            final_depth = final_smooth
        
        # Apply final contrast adjustment
        final_depth = np.clip(final_depth * 1.1 - 0.05, 0, 1)
        
        return final_depth
    
    def _save_depth_map(self, depth_map: np.ndarray, output_path: str):
        """Save depth map as 8-bit PNG."""
        # Convert to 8-bit
        depth_8bit = (depth_map * 255).astype(np.uint8)
        
        # Save as PNG
        cv2.imwrite(output_path, depth_8bit)
        
        print(f"Contrast SculptOK depth map saved to: {output_path}", file=sys.stderr)

def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description='Generate contrast SculptOK depth map')
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
        generator = SculptOKContrastGenerator(device=args.device, model_type=args.model)
        
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
            "message": "Contrast SculptOK depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image,
            "message": "Failed to generate contrast SculptOK depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
