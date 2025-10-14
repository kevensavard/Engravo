#!/usr/bin/env python3
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
