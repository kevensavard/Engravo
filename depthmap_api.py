#!/usr/bin/env python3
"""
Depth Map API for Node.js Integration
====================================

A simple API wrapper for the DepthMapGenerator that can be called
from Node.js applications via subprocess or HTTP requests.

Usage from Node.js:
const { spawn } = require('child_process');
const python = spawn('python', ['depthmap_api.py', 'input.jpg', 'output.png', '50']);
"""

import sys
import json
import argparse
import warnings
from pathlib import Path
from depthmap_generator import DepthMapGenerator

# Suppress all warnings and redirect to stderr
warnings.filterwarnings('ignore')
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
os.environ['HF_HUB_DISABLE_PROGRESS_BARS'] = '1'

# Redirect transformers warnings
import sys
from contextlib import redirect_stdout, redirect_stderr
import io

# Create a null device to discard output
class NullDevice:
    def write(self, s):
        pass
    def flush(self):
        pass

# Redirect stdout and stderr to null device during imports
original_stdout = sys.stdout
original_stderr = sys.stderr
sys.stdout = NullDevice()
sys.stderr = NullDevice()

# Import transformers with suppressed output
try:
    import transformers
    transformers.logging.set_verbosity_error()
    from transformers import pipeline
except:
    pass

# Restore stdout/stderr
sys.stdout = original_stdout
sys.stderr = original_stderr

def main():
    """Main function for command-line usage."""
    # Suppress all print statements to stderr
    import sys
    from contextlib import redirect_stdout, redirect_stderr
    
    # Redirect stdout to stderr for all print statements
    original_stdout = sys.stdout
    original_stderr = sys.stderr
    
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
        
        # Capture all output to a buffer
        from io import StringIO
        output_buffer = StringIO()
        
        # Initialize generator (capture all output)
        with redirect_stdout(output_buffer), redirect_stderr(output_buffer):
            generator = DepthMapGenerator(model_type=args.model, device="auto")
        
        # Calculate parameters based on detail level
        detail_weight = args.detail_level / 100.0
        
        # Model parameters
        model_params = {
            "scale_factor": 1.0,
            "invert_depth": args.invert
        }
        
        # Refinement parameters based on detail level
        refinement_params = {
            "smoothing_factor": args.smoothing * (1 - detail_weight),  # Less smoothing for higher detail
            "contrast_enhancement": 1.0 + detail_weight * 0.5,  # More contrast for higher detail
            "relief_exaggeration": args.relief
        }
        
        # Post-processing parameters
        postprocessing_params = {
            "gamma_correction": 1.0 + detail_weight * 0.2,  # Slight gamma adjustment
            "threshold_low": 0.05,
            "threshold_high": 0.95,
            "output_bit_depth": 8
        }
        
        # Generate depth map (capture all output)
        with redirect_stdout(output_buffer), redirect_stderr(output_buffer):
            depth_map = generator.generate_depth_map(
                image=args.input_image,
                output_path=args.output_path,
                target_size=tuple(args.size),
                model_params=model_params,
                refinement_params=refinement_params,
                postprocessing_params=postprocessing_params
            )
        
        # Return success result as JSON to stdout
        result = {
            "success": True,
            "input_image": args.input_image,
            "output_path": args.output_path,
            "detail_level": args.detail_level,
            "model_used": args.model,
            "output_size": depth_map.shape,
            "message": "Depth map generated successfully"
        }
        
        # Restore stdout and print JSON
        sys.stdout = original_stdout
        print(json.dumps(result))
        
    except Exception as e:
        # Return error result as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "input_image": args.input_image if 'args' in locals() else "unknown",
            "message": "Failed to generate depth map"
        }
        sys.stdout = original_stdout
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
