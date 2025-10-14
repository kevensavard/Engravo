#!/usr/bin/env python3
"""
Depth Map Generator for Laser Engraving
=======================================

A comprehensive Python module that converts any input image into a realistic 
depth map suitable for laser engraving with 3D relief effects.

This implementation uses a hybrid approach combining AI-based depth estimation
with traditional computer vision techniques for optimal results.

Author: AI Assistant
License: MIT
"""

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
import matplotlib.pyplot as plt
from typing import Optional, Tuple, Union
import warnings
import sys
warnings.filterwarnings('ignore')

# Try to import MiDaS
try:
    from transformers import pipeline
    MIDAS_AVAILABLE = True
except ImportError:
    MIDAS_AVAILABLE = False
    # Suppress warning for cleaner output
    pass

# Try to import ZoeDepth
try:
    from zoedepth.models.builder import build_model
    from zoedepth.utils.config import get_config
    ZOEDEPTH_AVAILABLE = True
except ImportError:
    ZOEDEPTH_AVAILABLE = False
    # Suppress warning for cleaner output
    pass

class DepthMapGenerator:
    """
    A comprehensive depth map generator for laser engraving applications.
    
    This class implements a hybrid approach combining AI-based monocular depth
    estimation with traditional computer vision techniques to produce high-quality
    depth maps suitable for laser engraving.
    """
    
    def __init__(self, model_type: str = "midas", device: str = "auto"):
        """
        Initialize the depth map generator.
        
        Args:
            model_type (str): Type of depth estimation model to use.
                             Options: "midas", "zoedepth", "fallback"
            device (str): Device to run inference on. Options: "auto", "cpu", "cuda"
        """
        self.model_type = model_type.lower()
        self.device = self._get_device(device)
        self.depth_model = None
        self._load_model()
        
    def _get_device(self, device: str) -> str:
        """Determine the best device for inference."""
        if device == "auto":
            if torch.cuda.is_available():
                return "cuda"
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                return "mps"
            else:
                return "cpu"
        return device
    
    def _load_model(self):
        """Load the specified depth estimation model."""
        print(f"Loading {self.model_type} model on {self.device}...", file=sys.stderr)
        
        if self.model_type == "midas" and MIDAS_AVAILABLE:
            try:
                # Load MiDaS model from transformers
                self.depth_model = pipeline(
                    "depth-estimation", 
                    model="Intel/dpt-large", 
                    device=0 if self.device == "cuda" else -1
                )
                print("[SUCCESS] MiDaS model loaded successfully")
            except Exception as e:
                print(f"[ERROR] Failed to load MiDaS: {e}")
                self.model_type = "fallback"
                
        elif self.model_type == "zoedepth" and ZOEDEPTH_AVAILABLE:
            try:
                # Load ZoeDepth model
                config = get_config("zoedepth", "infer", pretrained_resource="local::./checkpoints/depth_anything/checkpoint-epoch=20.ckpt")
                self.depth_model = build_model(config)
                self.depth_model.eval()
                if self.device != "cpu":
                    self.depth_model = self.depth_model.to(self.device)
                print("[SUCCESS] ZoeDepth model loaded successfully")
            except Exception as e:
                print(f"[ERROR] Failed to load ZoeDepth: {e}")
                self.model_type = "fallback"
        
        if self.model_type == "fallback":
            print("Using fallback depth estimation (no AI model)")
            self.depth_model = None
    
    def preprocess_image(self, image: Union[str, np.ndarray, Image.Image], 
                        target_size: Optional[Tuple[int, int]] = None,
                        apply_bilateral: bool = True,
                        apply_equalization: bool = True) -> np.ndarray:
        """
        Preprocess the input image for depth estimation.
        
        Args:
            image: Input image (file path, numpy array, or PIL Image)
            target_size: Target size (width, height) for resizing
            apply_bilateral: Whether to apply bilateral filtering
            apply_equalization: Whether to apply histogram equalization
            
        Returns:
            Preprocessed grayscale image as numpy array
        """
        print("Preprocessing image...")
        
        # Load image
        if isinstance(image, str):
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"Could not load image from {image}")
        elif isinstance(image, Image.Image):
            img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        else:
            img = image.copy()
        
        # Convert to grayscale
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
            
        # Resize while maintaining aspect ratio
        if target_size:
            h, w = gray.shape
            target_w, target_h = target_size
            scale = min(target_w/w, target_h/h)
            new_w, new_h = int(w*scale), int(h*scale)
            gray = cv2.resize(gray, (new_w, new_h), interpolation=cv2.INTER_AREA)
            
        # Apply bilateral filtering to reduce noise while preserving edges
        if apply_bilateral:
            gray = cv2.bilateralFilter(gray, 9, 75, 75)
            
        # Apply histogram equalization for better contrast
        if apply_equalization:
            gray = cv2.equalizeHist(gray)
            
        print(f"[SUCCESS] Image preprocessed: {gray.shape}")
        return gray
    
    def estimate_depth(self, image: np.ndarray, 
                      scale_factor: float = 1.0,
                      invert_depth: bool = False) -> np.ndarray:
        """
        Estimate depth map using the loaded AI model.
        
        Args:
            image: Preprocessed grayscale image
            scale_factor: Scale factor for depth values
            invert_depth: Whether to invert the depth map
            
        Returns:
            Depth map as numpy array (normalized 0-1)
        """
        print(f"Estimating depth using {self.model_type}...")
        
        if self.depth_model is None:
            # Fallback: Use traditional computer vision approach
            return self._fallback_depth_estimation(image)
        
        # Convert grayscale to RGB for model input
        if len(image.shape) == 2:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        else:
            rgb_image = image
            
        if self.model_type == "midas":
            return self._midas_depth_estimation(rgb_image, scale_factor, invert_depth)
        elif self.model_type == "zoedepth":
            return self._zoedepth_estimation(rgb_image, scale_factor, invert_depth)
        else:
            return self._fallback_depth_estimation(image)
    
    def _midas_depth_estimation(self, rgb_image: np.ndarray, 
                               scale_factor: float, invert_depth: bool) -> np.ndarray:
        """Estimate depth using MiDaS model."""
        try:
            # Convert to PIL Image for transformers
            pil_image = Image.fromarray(rgb_image)
            
            # Get depth prediction
            result = self.depth_model(pil_image)
            depth = result["depth"]
            
            # Convert to numpy array
            depth_array = np.array(depth)
            
            # Normalize to 0-1
            depth_array = (depth_array - depth_array.min()) / (depth_array.max() - depth_array.min())
            
            # Apply scale factor and inversion
            if invert_depth:
                depth_array = 1.0 - depth_array
            depth_array = depth_array * scale_factor
            depth_array = np.clip(depth_array, 0, 1)
            
            print("[SUCCESS] MiDaS depth estimation completed")
            return depth_array
            
        except Exception as e:
            print(f"[ERROR] MiDaS failed: {e}, falling back to traditional method")
            return self._fallback_depth_estimation(cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY))
    
    def _zoedepth_estimation(self, rgb_image: np.ndarray, 
                            scale_factor: float, invert_depth: bool) -> np.ndarray:
        """Estimate depth using ZoeDepth model."""
        try:
            # Preprocess for ZoeDepth
            rgb_tensor = torch.from_numpy(rgb_image).permute(2, 0, 1).float() / 255.0
            rgb_tensor = rgb_tensor.unsqueeze(0)
            
            if self.device != "cpu":
                rgb_tensor = rgb_tensor.to(self.device)
            
            # Get depth prediction
            with torch.no_grad():
                depth = self.depth_model.infer(rgb_tensor)
                depth = F.interpolate(depth, size=rgb_image.shape[:2], mode='bilinear', align_corners=False)
                depth = depth.squeeze().cpu().numpy()
            
            # Normalize to 0-1
            depth = (depth - depth.min()) / (depth.max() - depth.min())
            
            # Apply scale factor and inversion
            if invert_depth:
                depth = 1.0 - depth
            depth = depth * scale_factor
            depth = np.clip(depth, 0, 1)
            
            print("[SUCCESS] ZoeDepth estimation completed")
            return depth
            
        except Exception as e:
            print(f"[ERROR] ZoeDepth failed: {e}, falling back to traditional method")
            return self._fallback_depth_estimation(cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY))
    
    def _fallback_depth_estimation(self, gray_image: np.ndarray) -> np.ndarray:
        """
        Fallback depth estimation using traditional computer vision.
        
        This method uses shape-from-shading principles and edge detection
        to estimate depth from a single grayscale image.
        """
        print("Using fallback depth estimation...")
        
        # Create depth map based on brightness and edges
        # Brighter areas = closer (higher depth values)
        # Darker areas = farther (lower depth values)
        
        # Normalize image
        normalized = gray_image.astype(np.float32) / 255.0
        
        # Apply edge detection to enhance depth boundaries
        edges = cv2.Canny(gray_image, 50, 150)
        edges = edges.astype(np.float32) / 255.0
        
        # Combine brightness and edge information
        # Bright areas + strong edges = closer objects
        depth = normalized + 0.3 * edges
        
        # Apply Gaussian blur for smoothness
        depth = cv2.GaussianBlur(depth, (15, 15), 0)
        
        # Normalize to 0-1 range
        depth = (depth - depth.min()) / (depth.max() - depth.min())
        
        print("[SUCCESS] Fallback depth estimation completed")
        return depth
    
    def refine_depth_map(self, depth_map: np.ndarray,
                        smoothing_factor: float = 1.0,
                        contrast_enhancement: float = 1.0,
                        relief_exaggeration: float = 1.0) -> np.ndarray:
        """
        Refine the depth map for better engraving results.
        
        Args:
            depth_map: Raw depth map (0-1 range)
            smoothing_factor: Amount of smoothing to apply (0-2)
            contrast_enhancement: Amount of contrast enhancement (0-3)
            relief_exaggeration: Amount of relief exaggeration (0-3)
            
        Returns:
            Refined depth map
        """
        print("Refining depth map...")
        
        refined = depth_map.copy()
        
        # Apply edge-preserving smoothing
        if smoothing_factor > 0:
            # Convert to 8-bit for bilateral filter
            depth_8bit = (refined * 255).astype(np.uint8)
            smoothed = cv2.bilateralFilter(depth_8bit, 9, 75, 75)
            refined = smoothed.astype(np.float32) / 255.0
            
            # Blend with original based on smoothing factor
            refined = (1 - smoothing_factor) * depth_map + smoothing_factor * refined
        
        # Enhance local contrast using Laplacian
        if contrast_enhancement > 0:
            laplacian = cv2.Laplacian((refined * 255).astype(np.uint8), cv2.CV_64F)
            laplacian = laplacian.astype(np.float32) / 255.0
            refined = refined + contrast_enhancement * 0.1 * laplacian
            refined = np.clip(refined, 0, 1)
        
        # Apply relief exaggeration
        if relief_exaggeration > 1.0:
            # Enhance depth variations
            center = 0.5
            refined = center + (refined - center) * relief_exaggeration
            refined = np.clip(refined, 0, 1)
        
        print("[SUCCESS] Depth map refinement completed")
        return refined
    
    def postprocess_depth_map(self, depth_map: np.ndarray,
                             gamma_correction: float = 1.0,
                             threshold_low: float = 0.0,
                             threshold_high: float = 1.0,
                             output_bit_depth: int = 8) -> np.ndarray:
        """
        Post-process the depth map for final output.
        
        Args:
            depth_map: Refined depth map (0-1 range)
            gamma_correction: Gamma correction value (0.5-2.0)
            threshold_low: Lower threshold for clipping (0-1)
            threshold_high: Upper threshold for clipping (0-1)
            output_bit_depth: Output bit depth (8 or 16)
            
        Returns:
            Final depth map ready for saving
        """
        print("Post-processing depth map...")
        
        processed = depth_map.copy()
        
        # Apply gamma correction
        if gamma_correction != 1.0:
            processed = np.power(processed, gamma_correction)
        
        # Apply thresholding
        processed = np.clip(processed, threshold_low, threshold_high)
        
        # Normalize to full dynamic range
        if processed.min() != processed.max():
            processed = (processed - processed.min()) / (processed.max() - processed.min())
        
        # Convert to output bit depth
        if output_bit_depth == 8:
            processed = (processed * 255).astype(np.uint8)
        elif output_bit_depth == 16:
            processed = (processed * 65535).astype(np.uint16)
        else:
            raise ValueError("output_bit_depth must be 8 or 16")
        
        print(f"[SUCCESS] Post-processing completed: {processed.shape}, {processed.dtype}")
        return processed
    
    def generate_depth_map(self, image: Union[str, np.ndarray, Image.Image],
                          output_path: Optional[str] = None,
                          target_size: Optional[Tuple[int, int]] = (512, 512),
                          model_params: Optional[dict] = None,
                          refinement_params: Optional[dict] = None,
                          postprocessing_params: Optional[dict] = None) -> np.ndarray:
        """
        Generate a complete depth map from input image.
        
        Args:
            image: Input image
            output_path: Path to save the depth map (optional)
            target_size: Target size for processing
            model_params: Parameters for depth estimation
            refinement_params: Parameters for depth refinement
            postprocessing_params: Parameters for post-processing
            
        Returns:
            Final depth map as numpy array
        """
        print("=" * 50)
        print("GENERATING DEPTH MAP")
        print("=" * 50)
        
        # Default parameters
        model_params = model_params or {"scale_factor": 1.0, "invert_depth": True}
        refinement_params = refinement_params or {
            "smoothing_factor": 0.5,
            "contrast_enhancement": 1.0,
            "relief_exaggeration": 1.2
        }
        postprocessing_params = postprocessing_params or {
            "gamma_correction": 1.1,
            "threshold_low": 0.05,
            "threshold_high": 0.95,
            "output_bit_depth": 8
        }
        
        # Step 1: Preprocessing
        preprocessed = self.preprocess_image(image, target_size)
        
        # Step 2: Depth estimation
        depth_map = self.estimate_depth(preprocessed, **model_params)
        
        # Step 3: Refinement
        refined_depth = self.refine_depth_map(depth_map, **refinement_params)
        
        # Step 4: Post-processing
        final_depth = self.postprocess_depth_map(refined_depth, **postprocessing_params)
        
        # Step 5: Save if path provided
        if output_path:
            cv2.imwrite(output_path, final_depth)
            print(f"[SUCCESS] Depth map saved to: {output_path}")
        
        print("=" * 50)
        print("DEPTH MAP GENERATION COMPLETED")
        print("=" * 50)
        
        return final_depth
    
    def preview_3d_relief(self, depth_map: np.ndarray, 
                         title: str = "3D Depth Map Preview"):
        """
        Preview the 3D relief of the depth map using matplotlib.
        
        Args:
            depth_map: Depth map array
            title: Title for the plot
        """
        print("Generating 3D preview...")
        
        # Convert to float for visualization
        if depth_map.dtype == np.uint8:
            depth_float = depth_map.astype(np.float32) / 255.0
        elif depth_map.dtype == np.uint16:
            depth_float = depth_map.astype(np.float32) / 65535.0
        else:
            depth_float = depth_map
        
        # Create figure
        fig = plt.figure(figsize=(12, 8))
        
        # 3D surface plot
        ax1 = fig.add_subplot(121, projection='3d')
        y, x = np.mgrid[0:depth_float.shape[0], 0:depth_float.shape[1]]
        ax1.plot_surface(x, y, depth_float, cmap='viridis', alpha=0.8)
        ax1.set_title('3D Relief')
        ax1.set_xlabel('X')
        ax1.set_ylabel('Y')
        ax1.set_zlabel('Depth')
        
        # 2D depth map
        ax2 = fig.add_subplot(122)
        im = ax2.imshow(depth_float, cmap='gray', vmin=0, vmax=1)
        ax2.set_title('2D Depth Map')
        ax2.axis('off')
        plt.colorbar(im, ax=ax2, fraction=0.046, pad=0.04)
        
        plt.suptitle(title)
        plt.tight_layout()
        plt.show()
        
        print("[SUCCESS] 3D preview generated")


def main():
    """
    Example usage of the DepthMapGenerator.
    """
    print("Depth Map Generator for Laser Engraving")
    print("=====================================")
    
    # Initialize generator
    generator = DepthMapGenerator(model_type="midas", device="auto")
    
    # Example: Generate depth map from image file
    try:
        # You can replace this with your own image path
        image_path = "example_image.jpg"  # Replace with actual image path
        
        # Generate depth map
        depth_map = generator.generate_depth_map(
            image=image_path,
            output_path="depth_map_output.png",
            target_size=(512, 512),
            model_params={"scale_factor": 1.0, "invert_depth": True},
            refinement_params={
                "smoothing_factor": 0.5,
                "contrast_enhancement": 1.0,
                "relief_exaggeration": 1.2
            },
            postprocessing_params={
                "gamma_correction": 1.1,
                "threshold_low": 0.05,
                "threshold_high": 0.95,
                "output_bit_depth": 8
            }
        )
        
        # Preview 3D relief
        generator.preview_3d_relief(depth_map, "Generated Depth Map")
        
    except FileNotFoundError:
        print(f"Example image '{image_path}' not found.")
        print("Please provide a valid image path to test the generator.")
    
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
