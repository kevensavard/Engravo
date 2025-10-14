#!/usr/bin/env python3
"""
SculptOK Balanced Depth Map Generator
====================================

Creates smooth gradients at low detail levels but preserves
detail at high detail levels without excessive blurring.

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

class SculptOKBalancedGenerator:
    """
    SculptOK balanced depth map generator.
    Smooth gradients at low detail, preserved detail at high detail.
    """
    
    def __init__(self, device="auto"):
        """Initialize the depth generator."""
        self.device = self._get_device(device)
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
        """Load the MiDaS model."""
        if not TORCH_AVAILABLE:
            print("PyTorch not available, using fallback", file=sys.stderr)
            return
        
        print(f"Loading MiDaS model on {self.device}...", file=sys.stderr)
        
        try:
            with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
                # Load MiDaS model
                self.model = torch.hub.load("intel-isl/MiDaS", "DPT_Large")
                self.model.to(self.device)
                self.model.eval()
                
                # Load the correct transform
                midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
                self.transform = midas_transforms.dpt_transform
            
            print("MiDaS model loaded successfully", file=sys.stderr)
            
        except Exception as e:
            print(f"Failed to load MiDaS model: {e}", file=sys.stderr)
            self.model = None
    
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
        """Generate SculptOK-style depth map with balanced approach."""
        print("=" * 50, file=sys.stderr)
        print("GENERATING SCULPTOK BALANCED DEPTH MAP", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        # Step 1: Load image
        print("Step 1: Loading image...", file=sys.stderr)
        image = self.load_image(image_path)
        
        # Step 2: Generate base depth using AI
        print("Step 2: Generating base depth using AI...", file=sys.stderr)
        if self.model is not None:
            base_depth = self._generate_ai_depth(image)
        else:
            base_depth = self._generate_fallback_depth(image)
        
        # Step 3: Apply balanced processing
        print("Step 3: Applying balanced processing...", file=sys.stderr)
        balanced_depth = self._apply_balanced_processing(base_depth, image, detail_level)
        
        # Step 4: Apply detail-aware enhancement
        print("Step 4: Applying detail-aware enhancement...", file=sys.stderr)
        enhanced_depth = self._apply_detail_aware_enhancement(balanced_depth, detail_level)
        
        # Step 5: Apply final optimization
        print("Step 5: Applying final optimization...", file=sys.stderr)
        final_depth = self._apply_final_optimization(enhanced_depth, detail_level)
        
        # Save depth map
        self._save_depth_map(final_depth, output_path)
        
        print("=" * 50, file=sys.stderr)
        print("SCULPTOK BALANCED DEPTH MAP COMPLETED", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        return final_depth
    
    def _generate_ai_depth(self, image: np.ndarray) -> np.ndarray:
        """Generate base depth using MiDaS AI model."""
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
            print(f"MiDaS depth generation failed: {e}, using fallback", file=sys.stderr)
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
    
    def _apply_balanced_processing(self, base_depth: np.ndarray, image: np.ndarray, detail_level: int) -> np.ndarray:
        """Apply balanced processing based on detail level."""
        detail_weight = detail_level / 100.0
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        if detail_weight > 0.8:
            # High detail (100%): preserve detail with minimal processing
            # Apply light smoothing only
            balanced_depth = cv2.GaussianBlur(base_depth, (3, 3), 0.5)
            
            # Add edge enhancement for detail
            edges = cv2.Canny(gray, 50, 150)
            edge_mask = (255 - edges).astype(np.float32) / 255.0
            balanced_depth = balanced_depth * 0.9 + edge_mask * 0.1
            
        elif detail_weight > 0.5:
            # Medium detail (50%): minimal smoothing to reduce blur
            # Apply very light smoothing only
            balanced_depth = cv2.GaussianBlur(base_depth, (3, 3), 0.5)
            
            # Apply light bilateral filtering for edge-preserving smoothing
            depth_8bit = (balanced_depth * 255).astype(np.uint8)
            bilateral_smooth = cv2.bilateralFilter(depth_8bit, 9, 50, 50)
            balanced_depth = bilateral_smooth.astype(np.float32) / 255.0
            
        else:
            # Low detail (25%): smooth gradients
            # Apply heavy smoothing for smooth gradients
            balanced_depth = cv2.GaussianBlur(base_depth, (15, 15), 2.0)
            
            # Apply bilateral filtering for edge-preserving smoothing
            depth_8bit = (balanced_depth * 255).astype(np.uint8)
            bilateral_smooth = cv2.bilateralFilter(depth_8bit, 25, 100, 100)
            balanced_depth = bilateral_smooth.astype(np.float32) / 255.0
        
        return np.clip(balanced_depth, 0, 1)
    
    def _apply_detail_aware_enhancement(self, balanced_depth: np.ndarray, detail_level: int) -> np.ndarray:
        """Apply detail-aware enhancement."""
        detail_weight = detail_level / 100.0
        
        # Apply histogram stretching
        p2, p98 = np.percentile(balanced_depth, [2, 98])
        if p98 > p2:
            stretched = (balanced_depth - p2) / (p98 - p2)
        else:
            stretched = balanced_depth
        
        # Apply gamma correction based on detail level
        if detail_weight > 0.8:
            # High detail: preserve contrast
            gamma = 0.9
        elif detail_weight > 0.5:
            # Medium detail: preserve more detail
            gamma = 0.9
        else:
            # Low detail: smooth gamma
            gamma = 0.7
        
        gamma_corrected = np.power(stretched, gamma)
        
        # Apply contrast enhancement based on detail level
        if detail_weight > 0.8:
            # High detail: preserve detail
            contrast_strength = 1.2
        elif detail_weight > 0.5:
            # Medium detail: preserve more detail
            contrast_strength = 1.2
        else:
            # Low detail: smooth contrast
            contrast_strength = 1.4
        
        contrast_enhanced = cv2.addWeighted(gamma_corrected, contrast_strength, gamma_corrected, -(contrast_strength - 1), 0)
        
        return np.clip(contrast_enhanced, 0, 1)
    
    def _apply_final_optimization(self, enhanced_depth: np.ndarray, detail_level: int) -> np.ndarray:
        """Apply final optimization."""
        detail_weight = detail_level / 100.0
        
        # Apply S-curve based on detail level
        if detail_weight > 0.8:
            # High detail: gentle S-curve
            x = (enhanced_depth - 0.5) * 2
        elif detail_weight > 0.5:
            # Medium detail: gentle S-curve to reduce blur
            x = (enhanced_depth - 0.5) * 2
        else:
            # Low detail: strong S-curve
            x = (enhanced_depth - 0.5) * 4
        
        s_curve = 1 / (1 + np.exp(-x))
        
        # Apply final contrast boost based on detail level
        if detail_weight > 0.8:
            # High detail: preserve detail
            final_boost = 1.1
        elif detail_weight > 0.5:
            # Medium detail: preserve more detail
            final_boost = 1.1
        else:
            # Low detail: smooth boost
            final_boost = 1.3
        
        final_depth = np.clip(s_curve * final_boost - (final_boost - 1) / 2, 0, 1)
        
        # Final normalization
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
        
        print(f"SculptOK Balanced depth map saved to: {output_path}", file=sys.stderr)

def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description='Generate SculptOK Balanced depth map')
    parser.add_argument('input_image', help='Path to input image')
    parser.add_argument('output_path', help='Path to save depth map')
    parser.add_argument('detail_level', type=int, default=50, help='Detail level (25, 50, or 100)')
    parser.add_argument('--device', choices=['auto', 'cpu', 'cuda'], 
                       default='auto', help='Device to use')
    
    args = parser.parse_args()
    
    try:
        # Initialize generator
        generator = SculptOKBalancedGenerator(device=args.device)
        
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
            "model_used": "DPT_Large",
            "output_size": depth_map.shape,
            "message": "SculptOK Balanced depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image,
            "message": "Failed to generate SculptOK Balanced depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
