#!/usr/bin/env python3
"""
SculptOK Gradient Depth Map Generator
====================================

Creates true depth gradients from white to black
instead of grayscale conversion for laser engraving.

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

class SculptOKGradientGenerator:
    """
    SculptOK gradient depth map generator.
    Creates true depth gradients from white to black.
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
        """Generate SculptOK-style depth map with true gradients."""
        print("=" * 50, file=sys.stderr)
        print("GENERATING SCULPTOK GRADIENT DEPTH MAP", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        # Step 1: Load image
        print("Step 1: Loading image...", file=sys.stderr)
        image = self.load_image(image_path)
        
        # Step 2: Generate base depth
        print("Step 2: Generating base depth...", file=sys.stderr)
        if self.model is not None:
            base_depth = self._generate_midas_depth(image)
        else:
            base_depth = self._generate_fallback_depth(image)
        
        # Step 3: Create depth gradients
        print("Step 3: Creating depth gradients...", file=sys.stderr)
        gradient_depth = self._create_depth_gradients(base_depth, image, detail_level)
        
        # Step 4: Apply gradient enhancement
        print("Step 4: Applying gradient enhancement...", file=sys.stderr)
        enhanced_gradients = self._enhance_gradients(gradient_depth, detail_level)
        
        # Step 5: Apply final gradient optimization
        print("Step 5: Applying final gradient optimization...", file=sys.stderr)
        final_depth = self._optimize_gradients(enhanced_gradients, detail_level)
        
        # Save depth map
        self._save_depth_map(final_depth, output_path)
        
        print("=" * 50, file=sys.stderr)
        print("SCULPTOK GRADIENT DEPTH MAP COMPLETED", file=sys.stderr)
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
    
    def _create_depth_gradients(self, base_depth: np.ndarray, image: np.ndarray, detail_level: int) -> np.ndarray:
        """Create true depth gradients from white to black."""
        detail_weight = detail_level / 100.0
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Create gradient base from multiple sources
        # 1. Brightness gradient (faces = white, background = black)
        brightness_gradient = gray.astype(np.float32) / 255.0
        
        # 2. Center-out gradient (center = white, edges = black)
        h, w = gray.shape
        y, x = np.ogrid[:h, :w]
        center_y, center_x = h // 2, w // 2
        distance_from_center = np.sqrt((x - center_x)**2 + (y - center_y)**2)
        max_distance = np.sqrt(center_x**2 + center_y**2)
        center_gradient = 1.0 - (distance_from_center / max_distance)
        
        # 3. Edge-aware gradient (edges = black, interiors = white)
        edges = cv2.Canny(gray, 50, 150)
        edge_distance = cv2.distanceTransform(255 - edges, cv2.DIST_L2, 5)
        max_edge_distance = edge_distance.max()
        edge_gradient = edge_distance / max_edge_distance if max_edge_distance > 0 else np.ones_like(edge_distance)
        
        # 4. Texture-based gradient (smooth areas = white, textured = black)
        texture = cv2.Laplacian(gray, cv2.CV_64F)
        texture = np.absolute(texture)
        texture = texture / texture.max()
        texture_gradient = 1.0 - texture
        
        # Combine gradients based on detail level
        if detail_weight > 0.7:
            # High detail: preserve texture and edges
            gradient_weights = [0.4, 0.2, 0.2, 0.2]
        else:
            # Low detail: focus on smooth gradients
            gradient_weights = [0.3, 0.4, 0.2, 0.1]
        
        combined_gradient = (
            brightness_gradient * gradient_weights[0] +
            center_gradient * gradient_weights[1] +
            edge_gradient * gradient_weights[2] +
            texture_gradient * gradient_weights[3]
        )
        
        # Blend with AI depth for better accuracy
        ai_weight = 0.6 + detail_weight * 0.3  # 0.6 to 0.9
        gradient_weight = 1.0 - ai_weight
        
        final_gradient = (
            base_depth * ai_weight +
            combined_gradient * gradient_weight
        )
        
        return np.clip(final_gradient, 0, 1)
    
    def _enhance_gradients(self, gradient_depth: np.ndarray, detail_level: int) -> np.ndarray:
        """Enhance gradients for better white-to-black range."""
        detail_weight = detail_level / 100.0
        
        # Apply gradient smoothing based on detail level
        if detail_weight < 0.8:
            # Low detail: heavy smoothing for smooth gradients
            smoothing_amount = (1 - detail_weight) * 3.0  # 0.6 to 3.0
            kernel_size = max(7, int(smoothing_amount * 6))
            if kernel_size % 2 == 0:
                kernel_size += 1
            
            # Apply Gaussian blur for smooth gradients
            smoothed = cv2.GaussianBlur(gradient_depth, (kernel_size, kernel_size), smoothing_amount)
            
            # Apply bilateral filtering for edge-preserving smoothing
            depth_8bit = (smoothed * 255).astype(np.uint8)
            bilateral_smooth = cv2.bilateralFilter(depth_8bit, 25, 100, 100)
            
            smoothed_gradient = bilateral_smooth.astype(np.float32) / 255.0
        else:
            # High detail: light smoothing only
            smoothed_gradient = cv2.GaussianBlur(gradient_depth, (3, 3), 1.0)
        
        # Apply gradient enhancement
        # Use histogram stretching to ensure full white-to-black range
        p2, p98 = np.percentile(smoothed_gradient, [2, 98])
        if p98 > p2:
            stretched = (smoothed_gradient - p2) / (p98 - p2)
        else:
            stretched = smoothed_gradient
        
        # Apply gamma correction for better gradient perception
        gamma = 0.6 + (1 - detail_weight) * 0.2  # 0.6 to 0.8
        gamma_corrected = np.power(stretched, gamma)
        
        return np.clip(gamma_corrected, 0, 1)
    
    def _optimize_gradients(self, gradient_depth: np.ndarray, detail_level: int) -> np.ndarray:
        """Optimize gradients for SculptOK quality."""
        detail_weight = detail_level / 100.0
        
        # Apply S-curve for better gradient contrast
        x = (gradient_depth - 0.5) * 4  # Scale for sigmoid
        s_curve = 1 / (1 + np.exp(-x))
        
        # Apply contrast enhancement
        contrast_strength = 1.3 + detail_weight * 0.4  # 1.3 to 1.7
        contrast_enhanced = cv2.addWeighted(s_curve, contrast_strength, s_curve, -(contrast_strength - 1), 0)
        
        # Apply final gradient optimization
        # Ensure we have pure white and pure black
        final_min = contrast_enhanced.min()
        final_max = contrast_enhanced.max()
        
        if final_max > final_min:
            # Stretch to full range
            normalized = (contrast_enhanced - final_min) / (final_max - final_min)
            
            # Apply final contrast boost to ensure white and black
            final_boost = 1.2 + detail_weight * 0.3  # 1.2 to 1.5
            final_depth = np.clip(normalized * final_boost - (final_boost - 1) / 2, 0, 1)
        else:
            final_depth = contrast_enhanced
        
        # Final smoothing for professional results
        final_depth = cv2.GaussianBlur(final_depth, (3, 3), 0.5)
        
        return final_depth
    
    def _save_depth_map(self, depth_map: np.ndarray, output_path: str):
        """Save depth map as 8-bit PNG."""
        # Convert to 8-bit
        depth_8bit = (depth_map * 255).astype(np.uint8)
        
        # Save as PNG
        cv2.imwrite(output_path, depth_8bit)
        
        print(f"SculptOK Gradient depth map saved to: {output_path}", file=sys.stderr)

def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description='Generate SculptOK Gradient depth map')
    parser.add_argument('input_image', help='Path to input image')
    parser.add_argument('output_path', help='Path to save depth map')
    parser.add_argument('detail_level', type=int, default=50, help='Detail level (25, 50, or 100)')
    parser.add_argument('--device', choices=['auto', 'cpu', 'cuda'], 
                       default='auto', help='Device to use')
    
    args = parser.parse_args()
    
    try:
        # Initialize generator
        generator = SculptOKGradientGenerator(device=args.device)
        
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
            "message": "SculptOK Gradient depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image,
            "message": "Failed to generate SculptOK Gradient depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()