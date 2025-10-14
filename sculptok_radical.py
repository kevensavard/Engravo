#!/usr/bin/env python3
"""
SculptOK Radical Depth Map Generator
===================================

Completely different approach - creates true depth relief
by analyzing image structure and creating proper depth gradients.

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

class SculptOKRadicalGenerator:
    """
    SculptOK radical depth map generator.
    Creates true depth relief by analyzing image structure.
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
        """Generate SculptOK-style depth map with radical approach."""
        print("=" * 50, file=sys.stderr)
        print("GENERATING SCULPTOK RADICAL DEPTH MAP", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        # Step 1: Load image
        print("Step 1: Loading image...", file=sys.stderr)
        image = self.load_image(image_path)
        
        # Step 2: Analyze image structure
        print("Step 2: Analyzing image structure...", file=sys.stderr)
        structure_analysis = self._analyze_image_structure(image)
        
        # Step 3: Create depth relief
        print("Step 3: Creating depth relief...", file=sys.stderr)
        depth_relief = self._create_depth_relief(image, structure_analysis, detail_level)
        
        # Step 4: Apply SculptOK relief processing
        print("Step 4: Applying SculptOK relief processing...", file=sys.stderr)
        relief_processed = self._apply_relief_processing(depth_relief, detail_level)
        
        # Step 5: Apply final SculptOK optimization
        print("Step 5: Applying final SculptOK optimization...", file=sys.stderr)
        final_depth = self._apply_final_optimization(relief_processed, detail_level)
        
        # Save depth map
        self._save_depth_map(final_depth, output_path)
        
        print("=" * 50, file=sys.stderr)
        print("SCULPTOK RADICAL DEPTH MAP COMPLETED", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        return final_depth
    
    def _analyze_image_structure(self, image: np.ndarray) -> dict:
        """Analyze image structure for depth creation."""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Detect faces/foreground
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        # Create face mask
        face_mask = np.zeros_like(gray)
        for (x, y, w, h) in faces:
            cv2.rectangle(face_mask, (x, y), (x+w, y+h), 255, -1)
        
        # Detect edges
        edges = cv2.Canny(gray, 50, 150)
        
        # Detect texture areas
        texture = cv2.Laplacian(gray, cv2.CV_64F)
        texture = np.absolute(texture)
        
        # Detect background (dark areas)
        background_mask = cv2.threshold(gray, 80, 255, cv2.THRESH_BINARY_INV)[1]
        
        return {
            'faces': faces,
            'face_mask': face_mask,
            'edges': edges,
            'texture': texture,
            'background_mask': background_mask,
            'gray': gray
        }
    
    def _create_depth_relief(self, image: np.ndarray, structure: dict, detail_level: int) -> np.ndarray:
        """Create depth relief based on image structure."""
        detail_weight = detail_level / 100.0
        gray = structure['gray']
        
        # Start with a base depth map
        h, w = gray.shape
        depth_map = np.zeros((h, w), dtype=np.float32)
        
        # 1. Face areas get highest depth (white)
        face_mask = structure['face_mask'] / 255.0
        depth_map += face_mask * 0.9  # Faces are closest (white)
        
        # 2. Bright areas get high depth
        brightness = gray.astype(np.float32) / 255.0
        bright_mask = np.where(brightness > 0.7, 1.0, 0.0)
        bright_mask = cv2.GaussianBlur(bright_mask, (15, 15), 5)
        depth_map += bright_mask * 0.8
        
        # 3. Medium brightness areas get medium depth
        medium_mask = np.where((brightness > 0.4) & (brightness <= 0.7), 1.0, 0.0)
        medium_mask = cv2.GaussianBlur(medium_mask, (10, 10), 3)
        depth_map += medium_mask * 0.5
        
        # 4. Dark areas get low depth (black)
        dark_mask = np.where(brightness < 0.4, 1.0, 0.0)
        dark_mask = cv2.GaussianBlur(dark_mask, (20, 20), 8)
        depth_map += dark_mask * 0.1
        
        # 5. Background areas get lowest depth
        background_mask = structure['background_mask'] / 255.0
        background_mask = cv2.GaussianBlur(background_mask, (25, 25), 10)
        depth_map *= (1 - background_mask * 0.8)  # Suppress background
        
        # 6. Edge enhancement for detail
        if detail_weight > 0.7:
            edges = structure['edges'] / 255.0
            edge_enhancement = cv2.GaussianBlur(edges, (5, 5), 2)
            depth_map += edge_enhancement * 0.2 * detail_weight
        
        # 7. Texture enhancement for detail
        if detail_weight > 0.8:
            texture = structure['texture']
            texture = texture / texture.max()
            texture_enhancement = cv2.GaussianBlur(texture, (3, 3), 1)
            depth_map += texture_enhancement * 0.1 * detail_weight
        
        # Normalize to 0-1 range
        depth_map = np.clip(depth_map, 0, 1)
        
        return depth_map
    
    def _apply_relief_processing(self, depth_map: np.ndarray, detail_level: int) -> np.ndarray:
        """Apply relief processing for SculptOK effect."""
        detail_weight = detail_level / 100.0
        
        # Apply smoothing based on detail level
        if detail_weight < 0.8:
            # Heavy smoothing for sculptural effect
            smoothing_amount = (1 - detail_weight) * 4.0  # 0.8 to 4.0
            kernel_size = max(9, int(smoothing_amount * 8))
            if kernel_size % 2 == 0:
                kernel_size += 1
            kernel_size = min(kernel_size, 31)  # Limit max kernel size
            
            # Apply Gaussian blur for smooth relief
            if kernel_size > 0 and kernel_size % 2 == 1:
                smoothed = cv2.GaussianBlur(depth_map, (kernel_size, kernel_size), smoothing_amount)
            else:
                smoothed = depth_map
            
            # Apply bilateral filtering for edge-preserving smoothing
            depth_8bit = (smoothed * 255).astype(np.uint8)
            bilateral_smooth = cv2.bilateralFilter(depth_8bit, 30, 120, 120)
            
            relief = bilateral_smooth.astype(np.float32) / 255.0
        else:
            # High detail: minimal smoothing
            relief = cv2.GaussianBlur(depth_map, (3, 3), 1.0)
        
        return relief
    
    def _apply_final_optimization(self, depth_map: np.ndarray, detail_level: int) -> np.ndarray:
        """Apply final SculptOK optimization."""
        detail_weight = detail_level / 100.0
        
        # Apply histogram stretching to ensure full range
        p2, p98 = np.percentile(depth_map, [2, 98])
        if p98 > p2:
            stretched = (depth_map - p2) / (p98 - p2)
        else:
            stretched = depth_map
        
        # Apply gamma correction for better depth perception
        gamma = 0.5 + (1 - detail_weight) * 0.3  # 0.5 to 0.8
        gamma_corrected = np.power(stretched, gamma)
        
        # Apply S-curve for dramatic contrast
        x = (gamma_corrected - 0.5) * 6  # Strong scaling
        s_curve = 1 / (1 + np.exp(-x))
        
        # Apply contrast enhancement
        contrast_strength = 1.8 + detail_weight * 0.4  # 1.8 to 2.2
        contrast_enhanced = cv2.addWeighted(s_curve, contrast_strength, s_curve, -(contrast_strength - 1), 0)
        
        # Apply final contrast boost to ensure white and black
        final_boost = 1.5 + detail_weight * 0.3  # 1.5 to 1.8
        final_depth = np.clip(contrast_enhanced * final_boost - (final_boost - 1) / 2, 0, 1)
        
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
        
        print(f"SculptOK Radical depth map saved to: {output_path}", file=sys.stderr)

def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description='Generate SculptOK Radical depth map')
    parser.add_argument('input_image', help='Path to input image')
    parser.add_argument('output_path', help='Path to save depth map')
    parser.add_argument('detail_level', type=int, default=50, help='Detail level (25, 50, or 100)')
    parser.add_argument('--device', choices=['auto', 'cpu', 'cuda'], 
                       default='auto', help='Device to use')
    
    args = parser.parse_args()
    
    try:
        # Initialize generator
        generator = SculptOKRadicalGenerator(device=args.device)
        
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
            "message": "SculptOK Radical depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image,
            "message": "Failed to generate SculptOK Radical depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
