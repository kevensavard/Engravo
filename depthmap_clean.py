#!/usr/bin/env python3
"""
Clean Depth Map API - Only outputs JSON
========================================
"""

import sys
import json
import argparse
import warnings
import os
from pathlib import Path

# Suppress all warnings and set environment variables
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
os.environ['HF_HUB_DISABLE_PROGRESS_BARS'] = '1'

# Redirect all output to devnull during imports
from contextlib import redirect_stdout, redirect_stderr
import io

class DevNull:
    def write(self, x): pass
    def flush(self): pass

# Suppress all output during imports
sys.stdout = DevNull()
sys.stderr = DevNull()

try:
    from depthmap_generator import DepthMapGenerator
finally:
    # Restore stdout/stderr
    sys.stdout = sys.__stdout__
    sys.stderr = sys.__stderr__

def main():
    """Main function - only outputs JSON."""
    try:
        parser = argparse.ArgumentParser(description='Generate depth map for laser engraving')
        parser.add_argument('input_image', help='Path to input image')
        parser.add_argument('output_path', help='Path to save depth map')
        parser.add_argument('detail_level', type=int, default=50, help='Detail level (0-100)')
        parser.add_argument('--model', default='midas', choices=['midas', 'zoedepth', 'fallback'], 
                           help='Depth estimation model')
        parser.add_argument('--size', type=int, nargs=2, default=[512, 512], 
                           help='Target size (width height)')
        parser.add_argument('--invert', action='store_true', help='Invert depth map')
        parser.add_argument('--smoothing', type=float, default=0.5, help='Smoothing factor (0-2)')
        parser.add_argument('--relief', type=float, default=1.2, help='Relief exaggeration (0-3)')
        
        args = parser.parse_args()
        
        # Suppress all output during processing
        with redirect_stdout(DevNull()), redirect_stderr(DevNull()):
            # Initialize generator
            generator = DepthMapGenerator(model_type=args.model, device="auto")
            
            # Calculate parameters based on detail level
            detail_weight = args.detail_level / 100.0
            
            # Model parameters - adjusted for better depth perception
            model_params = {
                "scale_factor": 2.0,  # Increase scale for more depth variation
                "invert_depth": False  # Don't invert - let the model handle it
            }
            
            # Refinement parameters - optimized for smooth gradients
            refinement_params = {
                "smoothing_factor": 0.3 + (1 - detail_weight) * 0.4,  # Less smoothing for high detail
                "contrast_enhancement": 1.5 + detail_weight * 0.8,  # Stronger contrast
                "relief_exaggeration": 1.5 + detail_weight * 1.0  # More relief for depth
            }
            
            # Post-processing parameters - optimized for laser engraving
            postprocessing_params = {
                "gamma_correction": 0.8 + detail_weight * 0.4,  # Gamma for better gradients
                "threshold_low": 0.02,  # Lower threshold
                "threshold_high": 0.98,  # Higher threshold
                "output_bit_depth": 8
            }
            
            # Generate depth map
            depth_map = generator.generate_depth_map(
                image=args.input_image,
                output_path=args.output_path,
                target_size=tuple(args.size),
                model_params=model_params,
                refinement_params=refinement_params,
                postprocessing_params=postprocessing_params
            )
        
        # Return success result as JSON
        result = {
            "success": True,
            "input_image": args.input_image,
            "output_path": args.output_path,
            "detail_level": args.detail_level,
            "model_used": args.model,
            "output_size": depth_map.shape,
            "message": "Depth map generated successfully"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image if 'args' in locals() else "unknown",
            "message": "Failed to generate depth map"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
