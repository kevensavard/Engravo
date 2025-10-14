#!/usr/bin/env python3
"""
SculptOK-Quality Depth Map Generator
===================================

Generates smooth, sculpted 3D-style depth maps suitable for laser engraving.
Produces realistic bas-relief effects comparable to SculptOK quality.

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
from scipy import ndimage
from scipy.ndimage import gaussian_filter
import matplotlib.pyplot as plt

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

# Try to import ZoeDepth
try:
    import zoedepth
    ZOEDEPTH_AVAILABLE = True
except ImportError:
    ZOEDEPTH_AVAILABLE = False

# Restore stdout/stderr
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__

class SculptOKDepthGenerator:
    """
    SculptOK-quality depth map generator with smooth, sculpted 3D-style relief effects.
    """
    
    def __init__(self, device="auto", model_type="midas"):
        """
        Initialize the depth generator.
        
        Args:
            device: "auto", "cpu", or "cuda"
            model_type: "midas" or "zoedepth"
        """
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
        
        elif self.model_type == "zoedepth" and ZOEDEPTH_AVAILABLE:
            try:
                with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
                    # Load ZoeDepth model
                    model = torch.hub.load("isl-org/ZoeDepth", "ZoeD_N", pretrained=True)
                    model.eval()
                    if self.device != "cpu":
                        model = model.to(self.device)
                    self.depth_estimator = model
                print("ZoeDepth model loaded successfully", file=sys.stderr)
            except Exception as e:
                print(f"Failed to load ZoeDepth: {e}", file=sys.stderr)
                self.model_type = "fallback"
        
        if self.model_type == "fallback":
            print("Using fallback depth estimation", file=sys.stderr)
    
    def load_image(self, image_path: str) -> np.ndarray:
        """
        Load and preprocess image.
        
        Args:
            image_path: Path to input image
            
        Returns:
            Preprocessed RGB image array
        """
        # Load image
        if isinstance(image_path, str):
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"Could not load image from {image_path}")
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        else:
            img = np.array(image_path)
        
        # Resize to max 1024px while preserving aspect ratio
        h, w = img.shape[:2]
        if max(h, w) > 1024:
            scale = 1024 / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        # Normalize brightness
        img = self._normalize_brightness(img)
        
        return img
    
    def _normalize_brightness(self, img: np.ndarray) -> np.ndarray:
        """Normalize image brightness."""
        # Convert to LAB color space for brightness normalization
        lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        
        # Normalize L channel
        l_norm = cv2.normalize(l, None, 0, 255, cv2.NORM_MINMAX)
        
        # Reconstruct image
        lab_norm = cv2.merge([l_norm, a, b])
        img_norm = cv2.cvtColor(lab_norm, cv2.COLOR_LAB2RGB)
        
        return img_norm
    
    def generate_depthmap(self, image_path: str, output_path: str, 
                         exaggeration: float = 1.0, smoothness: float = 0.6) -> np.ndarray:
        """
        Generate SculptOK-quality depth map.
        
        Args:
            image_path: Path to input image
            output_path: Path to save depth map
            exaggeration: Depth exaggeration factor (0.5-2.0)
            smoothness: Smoothness factor (0.0-1.0)
            
        Returns:
            Generated depth map as numpy array
        """
        print("=" * 50, file=sys.stderr)
        print("GENERATING SCULPTOK-QUALITY DEPTH MAP", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        # Step 1: Preprocessing
        print("Step 1: Preprocessing image...", file=sys.stderr)
        image = self.load_image(image_path)
        preprocessed = self._preprocess_image(image)
        
        # Step 2: Monocular Depth Estimation
        print("Step 2: Estimating base depth...", file=sys.stderr)
        base_depth = self._estimate_base_depth(preprocessed)
        
        # Step 3: Surface Enhancement
        print("Step 3: Enhancing surface details...", file=sys.stderr)
        enhanced_depth = self._enhance_surface_details(base_depth, preprocessed)
        
        # Step 4: Artistic Depth Sculpting
        print("Step 4: Applying artistic sculpting...", file=sys.stderr)
        sculpted_depth = self._apply_artistic_sculpting(enhanced_depth, exaggeration, smoothness)
        
        # Step 5: Postprocessing
        print("Step 5: Final postprocessing...", file=sys.stderr)
        final_depth = self._final_postprocessing(sculpted_depth)
        
        # Save as 16-bit PNG
        self._save_depth_map(final_depth, output_path)
        
        print("=" * 50, file=sys.stderr)
        print("DEPTH MAP GENERATION COMPLETED", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        return final_depth
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Apply preprocessing steps."""
        # Convert to grayscale for processing
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Apply CLAHE for enhanced midtone details
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        # Optional: Detect and blur background slightly
        # This is a simple approach - could be enhanced with segmentation
        try:
            background_mask = self._detect_background(gray)
            blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
            enhanced = np.where(background_mask, blurred, enhanced)
        except Exception as e:
            # Skip background detection if it fails
            pass
        
        return enhanced
    
    def _detect_background(self, gray: np.ndarray) -> np.ndarray:
        """Simple background detection."""
        # Ensure proper data type
        gray = gray.astype(np.uint8)
        
        # Use edge density to detect background areas
        edges = cv2.Canny(gray, 50, 150)
        
        # Dilate edges to create larger regions
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        dilated = cv2.dilate(edges, kernel, iterations=2)
        
        # Areas with few edges are likely background
        edge_density = cv2.filter2D(dilated.astype(np.float32), -1, 
                                   np.ones((31, 31), dtype=np.float32) / (31*31))
        background_mask = edge_density < 0.1
        
        return background_mask
    
    def _estimate_base_depth(self, image: np.ndarray) -> np.ndarray:
        """Estimate base depth using AI model or fallback method."""
        if self.depth_estimator is not None and self.model_type != "fallback":
            return self._ai_depth_estimation(image)
        else:
            return self._fallback_depth_estimation(image)
    
    def _ai_depth_estimation(self, image: np.ndarray) -> np.ndarray:
        """AI-based depth estimation."""
        try:
            if self.model_type == "midas":
                # Convert to PIL for transformers
                pil_image = Image.fromarray(image)
                
                with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
                    result = self.depth_estimator(pil_image)
                
                depth = np.array(result['depth'])
                
                # Normalize to 0-1
                depth = (depth - depth.min()) / (depth.max() - depth.min())
                
                # Invert for laser engraving (brighter = closer)
                depth = 1.0 - depth
                
            elif self.model_type == "zoedepth":
                # Convert to tensor for ZoeDepth
                img_tensor = torch.from_numpy(image).permute(2, 0, 1).float() / 255.0
                img_tensor = img_tensor.unsqueeze(0)
                
                if self.device != "cpu":
                    img_tensor = img_tensor.to(self.device)
                
                with torch.no_grad():
                    depth = self.depth_estimator.infer(img_tensor)
                
                depth = depth.cpu().numpy().squeeze()
                
                # Normalize to 0-1
                depth = (depth - depth.min()) / (depth.max() - depth.min())
                
                # Invert for laser engraving
                depth = 1.0 - depth
            
            return depth
            
        except Exception as e:
            print(f"AI depth estimation failed: {e}, using fallback", file=sys.stderr)
            return self._fallback_depth_estimation(image)
    
    def _fallback_depth_estimation(self, image: np.ndarray) -> np.ndarray:
        """Fallback depth estimation using traditional computer vision."""
        # Multi-method approach
        brightness_depth = image.astype(np.float32) / 255.0
        
        # Edge-based depth
        edges = cv2.Canny(image, 50, 150)
        edge_depth = (255 - edges).astype(np.float32) / 255.0
        
        # Distance transform
        binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        dist_transform = cv2.distanceTransform(binary, cv2.DIST_L2, 5)
        dist_depth = (dist_transform / dist_transform.max()).astype(np.float32)
        
        # Gradient-based depth
        grad_x = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        gradient_depth = (gradient_magnitude / gradient_magnitude.max()).astype(np.float32)
        
        # Combine methods
        depth = (
            0.4 * brightness_depth +
            0.3 * edge_depth +
            0.2 * dist_depth +
            0.1 * gradient_depth
        )
        
        # Normalize
        depth = (depth - depth.min()) / (depth.max() - depth.min())
        
        return depth
    
    def _enhance_surface_details(self, depth: np.ndarray, image: np.ndarray) -> np.ndarray:
        """Enhance surface details using gradient-based enhancement."""
        # Compute local gradients for shape-from-shading
        grad_x = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3)
        
        # Gradient magnitude
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        gradient_normalized = gradient_magnitude / gradient_magnitude.max()
        
        # Blend gradients with original depth
        enhanced_depth = 0.7 * depth + 0.3 * gradient_normalized
        
        # Apply bilateral filtering to smooth while keeping edges
        depth_8bit = (enhanced_depth * 255).astype(np.uint8)
        smoothed = cv2.bilateralFilter(depth_8bit, 9, 75, 75)
        enhanced_depth = smoothed.astype(np.float32) / 255.0
        
        # Unsharp masking for edge refinement
        gaussian = cv2.GaussianBlur(enhanced_depth, (3, 3), 0)
        unsharp_mask = cv2.addWeighted(enhanced_depth, 1.5, gaussian, -0.5, 0)
        
        return unsharp_mask
    
    def _apply_artistic_sculpting(self, depth: np.ndarray, exaggeration: float, 
                                smoothness: float) -> np.ndarray:
        """Apply artistic depth sculpting for bas-relief effect."""
        # Nonlinear remapping to increase perceived relief
        # Use sigmoid-like function for smooth transitions
        sculpted = self._sigmoid_remapping(depth, exaggeration)
        
        # Apply curve fitting to push midtones up and background down
        sculpted = self._curve_remapping(sculpted)
        
        # Optional: Boost local depth intensity around main subjects
        sculpted = self._boost_subject_depth(sculpted, depth)
        
        # Apply smoothness control
        if smoothness > 0:
            sigma = smoothness * 10  # Adjust smoothing based on parameter
            sculpted = gaussian_filter(sculpted, sigma=sigma)
        
        return sculpted
    
    def _sigmoid_remapping(self, depth: np.ndarray, exaggeration: float) -> np.ndarray:
        """Apply sigmoid-like remapping for relief exaggeration."""
        # Sigmoid function with adjustable steepness
        steepness = 0.7 + (exaggeration - 1.0) * 0.3
        x = (depth - 0.5) * steepness * 4
        sigmoid = 1 / (1 + np.exp(-x))
        return sigmoid
    
    def _curve_remapping(self, depth: np.ndarray) -> np.ndarray:
        """Apply curve remapping to enhance midtones."""
        # Piecewise linear remapping
        # Push midtones (0.3-0.7) up, compress extremes
        remapped = depth.copy()
        
        # Enhance midtones
        mask = (depth >= 0.3) & (depth <= 0.7)
        remapped[mask] = 0.3 + (depth[mask] - 0.3) * 1.5
        
        # Compress low values
        mask = depth < 0.3
        remapped[mask] = depth[mask] * 0.7
        
        # Compress high values
        mask = depth > 0.7
        remapped[mask] = 0.7 + (depth[mask] - 0.7) * 0.8
        
        return np.clip(remapped, 0, 1)
    
    def _boost_subject_depth(self, sculpted: np.ndarray, original_depth: np.ndarray) -> np.ndarray:
        """Boost depth intensity around main subjects."""
        # Simple approach: boost areas with significant depth variation
        depth_variation = cv2.Laplacian(original_depth, cv2.CV_64F)
        depth_variation = np.absolute(depth_variation)
        
        # Normalize variation
        if depth_variation.max() > 0:
            depth_variation = depth_variation / depth_variation.max()
        
        # Boost areas with high variation (likely subjects)
        boost_mask = depth_variation > 0.3
        boosted = sculpted.copy()
        boosted[boost_mask] = sculpted[boost_mask] * 1.1
        
        return np.clip(boosted, 0, 1)
    
    def _final_postprocessing(self, depth: np.ndarray) -> np.ndarray:
        """Final postprocessing steps."""
        # Normalize to full range
        depth_normalized = (depth - depth.min()) / (depth.max() - depth.min())
        
        # Clip outliers (keep within 2nd-98th percentile)
        p2, p98 = np.percentile(depth_normalized, [2, 98])
        depth_clipped = np.clip(depth_normalized, p2, p98)
        
        # Re-normalize
        depth_final = (depth_clipped - depth_clipped.min()) / (depth_clipped.max() - depth_clipped.min())
        
        return depth_final
    
    def _save_depth_map(self, depth: np.ndarray, output_path: str):
        """Save depth map as 16-bit PNG."""
        # Convert to 16-bit
        depth_16bit = (depth * 65535).astype(np.uint16)
        
        # Save as PNG
        cv2.imwrite(output_path, depth_16bit)
        
        print(f"Depth map saved to: {output_path}", file=sys.stderr)
    
    def preview_depth_map(self, original_path: str, depth_map: np.ndarray, 
                         output_path: str = None):
        """Create preview with original and depth map side by side."""
        # Load original image
        original = cv2.imread(original_path)
        original = cv2.cvtColor(original, cv2.COLOR_BGR2RGB)
        
        # Resize to match
        h, w = original.shape[:2]
        depth_resized = cv2.resize(depth_map, (w, h))
        
        # Create side-by-side preview
        fig, axes = plt.subplots(1, 2, figsize=(12, 6))
        
        axes[0].imshow(original)
        axes[0].set_title('Original Image')
        axes[0].axis('off')
        
        axes[1].imshow(depth_resized, cmap='gray')
        axes[1].set_title('Depth Map')
        axes[1].axis('off')
        
        plt.tight_layout()
        
        if output_path:
            plt.savefig(output_path, dpi=150, bbox_inches='tight')
            print(f"Preview saved to: {output_path}", file=sys.stderr)
        
        plt.show()

def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description='Generate SculptOK-quality depth map')
    parser.add_argument('input_image', help='Path to input image')
    parser.add_argument('output_path', help='Path to save depth map')
    parser.add_argument('--exaggeration', type=float, default=1.0, 
                       help='Depth exaggeration factor (0.5-2.0)')
    parser.add_argument('--smoothness', type=float, default=0.6, 
                       help='Smoothness factor (0.0-1.0)')
    parser.add_argument('--model', choices=['midas', 'zoedepth', 'fallback'], 
                       default='midas', help='Depth estimation model')
    parser.add_argument('--device', choices=['auto', 'cpu', 'cuda'], 
                       default='auto', help='Device to use')
    parser.add_argument('--preview', action='store_true', 
                       help='Show preview with matplotlib')
    
    args = parser.parse_args()
    
    try:
        # Initialize generator
        generator = SculptOKDepthGenerator(device=args.device, model_type=args.model)
        
        # Generate depth map
        with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
            depth_map = generator.generate_depthmap(
                args.input_image, 
                args.output_path,
                exaggeration=args.exaggeration,
                smoothness=args.smoothness
            )
        
        # Show preview if requested
        if args.preview:
            preview_path = args.output_path.replace('.png', '_preview.png')
            generator.preview_depth_map(args.input_image, depth_map, preview_path)
        
        # Return success result as JSON
        result = {
            "success": True,
            "input_image": args.input_image,
            "output_path": args.output_path,
            "exaggeration": args.exaggeration,
            "smoothness": args.smoothness,
            "model_used": args.model,
            "output_size": depth_map.shape,
            "message": "SculptOK-quality depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image,
            "message": "Failed to generate SculptOK-quality depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
