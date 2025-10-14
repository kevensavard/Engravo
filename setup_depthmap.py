#!/usr/bin/env python3
"""
Setup script for Depth Map Generator
===================================

This script installs the required dependencies and sets up the environment
for the depth map generator.
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"[INFO] {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"[SUCCESS] {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {description} failed:")
        print(f"   Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible."""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"[ERROR] Python {version.major}.{version.minor} is not supported.")
        print("   Please install Python 3.8 or higher.")
        return False
    print(f"[SUCCESS] Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def install_dependencies():
    """Install required Python packages."""
    dependencies = [
        "opencv-python>=4.8.0",
        "numpy>=1.21.0",
        "Pillow>=9.0.0",
        "matplotlib>=3.5.0",
        "torch>=2.0.0",
        "torchvision>=0.15.0",
        "transformers>=4.30.0"
    ]
    
    print("[INFO] Installing Python dependencies...")
    
    for dep in dependencies:
        if not run_command(f"pip install {dep}", f"Installing {dep}"):
            return False
    
    return True

def test_installation():
    """Test if the installation works."""
    print("[INFO] Testing installation...")
    
    test_code = """
import cv2
import numpy as np
import torch
from PIL import Image
import matplotlib.pyplot as plt
from transformers import pipeline

print("[SUCCESS] All imports successful")
print(f"[SUCCESS] OpenCV version: {cv2.__version__}")
print(f"[SUCCESS] NumPy version: {np.__version__}")
print(f"[SUCCESS] PyTorch version: {torch.__version__}")
print(f"[SUCCESS] CUDA available: {torch.cuda.is_available()}")

# Test MiDaS availability
try:
    depth_estimator = pipeline("depth-estimation", model="Intel/dpt-large")
    print("[SUCCESS] MiDaS model loaded successfully")
except Exception as e:
    print(f"[WARNING] MiDaS model test failed: {e}")
    print("   This is normal if transformers is not fully configured")
"""
    
    try:
        exec(test_code)
        return True
    except Exception as e:
        print(f"[ERROR] Installation test failed: {e}")
        return False

def create_test_script():
    """Create a simple test script."""
    test_script = """#!/usr/bin/env python3
'''
Simple test for the depth map generator
'''

import numpy as np
from depthmap_generator import DepthMapGenerator

def test_basic_functionality():
    # Create a simple test image
    test_image = np.random.randint(0, 255, (256, 256), dtype=np.uint8)
    
    # Initialize generator
    generator = DepthMapGenerator(model_type="fallback", device="cpu")
    
    # Generate depth map
    depth_map = generator.generate_depth_map(
        image=test_image,
        output_path="test_depth_map.png",
        target_size=(256, 256)
    )
    
    print(f"Test completed successfully!")
    print(f"   Output shape: {depth_map.shape}")
    print(f"   Output dtype: {depth_map.dtype}")
    print(f"   Min/Max values: {depth_map.min()}/{depth_map.max()}")

if __name__ == "__main__":
    test_basic_functionality()
"""
    
    with open("test_depthmap.py", "w", encoding="utf-8") as f:
        f.write(test_script)
    
    print("Test script created: test_depthmap.py")

def main():
    """Main setup function."""
    print("[INFO] Setting up Depth Map Generator")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("[ERROR] Failed to install dependencies")
        sys.exit(1)
    
    # Test installation
    if not test_installation():
        print("[ERROR] Installation test failed")
        sys.exit(1)
    
    # Create test script
    create_test_script()
    
    print("=" * 40)
    print("[SUCCESS] Setup completed successfully!")
    print()
    print("Next steps:")
    print("1. Test the installation: python test_depthmap.py")
    print("2. Try the depth map generator with your images")
    print("3. The generator is ready to use with your Node.js app")
    print()
    print("Example usage:")
    print("  python depthmap_api.py input.jpg output.png 50")

if __name__ == "__main__":
    main()
