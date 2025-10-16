#!/usr/bin/env python3
"""
Professional Image Vectorization Script
Creates high-quality SVG vectors from raster images using OpenCV and advanced algorithms
"""

import cv2
import numpy as np
from PIL import Image
import svgwrite
from skimage import segmentation, color, measure
from skimage.filters import threshold_otsu, gaussian
from skimage.morphology import binary_closing, binary_opening
from sklearn.cluster import KMeans
import argparse
import sys
import os
from typing import List, Tuple, Optional
import json

class ProfessionalVectorizer:
    def __init__(self, max_colors: int = 16, edge_threshold_low: int = 50, edge_threshold_high: int = 150):
        self.max_colors = max_colors
        self.edge_threshold_low = edge_threshold_low
        self.edge_threshold_high = edge_threshold_high
        
    def load_and_preprocess_image(self, image_path: str) -> np.ndarray:
        """Load image and apply preprocessing"""
        print(f"Loading image: {image_path}")
        
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image: {image_path}")
            
        # Convert BGR to RGB
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Resize if too large (max 2000px on longest side)
        height, width = image.shape[:2]
        max_dimension = 2000
        if max(height, width) > max_dimension:
            scale = max_dimension / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
            print(f"Resized image to {new_width}x{new_height}")
        
        # Apply denoising
        image = cv2.bilateralFilter(image, 9, 75, 75)
        
        # Optional: slight Gaussian blur for smoothing
        image = gaussian(image, sigma=0.5, multichannel=True)
        image = (image * 255).astype(np.uint8)
        
        return image
    
    def analyze_colors(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Perform color analysis and segmentation"""
        print("Analyzing colors...")
        
        # Reshape image for K-means
        h, w, c = image.shape
        image_reshaped = image.reshape(-1, 3)
        
        # Apply K-means clustering
        kmeans = KMeans(n_clusters=self.max_colors, random_state=42, n_init=10)
        kmeans.fit(image_reshaped)
        
        # Get dominant colors and labels
        dominant_colors = kmeans.cluster_centers_.astype(np.uint8)
        labels = kmeans.labels_.reshape(h, w)
        
        print(f"Found {len(dominant_colors)} dominant colors")
        return dominant_colors, labels
    
    def detect_edges(self, image: np.ndarray) -> np.ndarray:
        """Advanced edge detection"""
        print("Detecting edges...")
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Canny edge detection
        edges = cv2.Canny(blurred, self.edge_threshold_low, self.edge_threshold_high)
        
        # Morphological operations to clean up edges
        kernel = np.ones((2, 2), np.uint8)
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        
        return edges
    
    def extract_contours(self, edges: np.ndarray) -> List[np.ndarray]:
        """Extract and simplify contours"""
        print("Extracting contours...")
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter out very small contours
        min_area = 50
        filtered_contours = [c for c in contours if cv2.contourArea(c) > min_area]
        
        print(f"Found {len(filtered_contours)} contours")
        
        # Simplify contours using Ramer-Douglas-Peucker
        simplified_contours = []
        for contour in filtered_contours:
            epsilon = 0.005 * cv2.arcLength(contour, True)
            simplified = cv2.approxPolyDP(contour, epsilon, True)
            simplified_contours.append(simplified)
        
        return simplified_contours
    
    def fit_bezier_curves(self, contour: np.ndarray) -> List[Tuple]:
        """Fit cubic Bezier curves to contour points"""
        if len(contour) < 4:
            return []
        
        curves = []
        points = contour.reshape(-1, 2)
        
        # Simple Bezier curve fitting
        for i in range(0, len(points) - 3, 3):
            p0 = points[i]
            p1 = points[i + 1] if i + 1 < len(points) else points[0]
            p2 = points[i + 2] if i + 2 < len(points) else points[0]
            p3 = points[i + 3] if i + 3 < len(points) else points[0]
            
            curves.append((p0, p1, p2, p3))
        
        return curves
    
    def create_svg(self, image: np.ndarray, contours: List[np.ndarray], 
                   dominant_colors: np.ndarray, labels: np.ndarray, output_path: str):
        """Create SVG file with vector paths"""
        print(f"Creating SVG: {output_path}")
        
        height, width = image.shape[:2]
        dwg = svgwrite.Drawing(output_path, size=(width, height))
        
        # Add definitions for gradients and filters
        defs = dwg.defs()
        
        # Add filter for smooth edges
        filter_elem = defs.add(dwg.filter(id="smooth", x=0, y=0, width="100%", height="100%"))
        filter_elem.add(dwg.feGaussianBlur(stdDeviation=0.5))
        
        # Create paths for each contour
        for i, contour in enumerate(contours):
            if len(contour) < 3:
                continue
                
            # Get color for this contour based on region
            center_point = contour[0][0]
            x, y = int(center_point[0]), int(center_point[1])
            if 0 <= x < width and 0 <= y < height:
                color_label = labels[y, x]
                color_rgb = dominant_colors[color_label]
                fill_color = f"rgb({color_rgb[0]},{color_rgb[1]},{color_rgb[2]})"
            else:
                fill_color = "rgb(0,0,0)"
            
            # Create path element
            path_data = f"M {contour[0][0][0]},{contour[0][0][1]}"
            for point in contour[1:]:
                path_data += f" L {point[0][0]},{point[0][1]}"
            path_data += " Z"
            
            # Add path to SVG
            path = dwg.path(d=path_data, fill=fill_color, stroke="none", filter="url(#smooth)")
            dwg.add(path)
        
        # Save SVG
        dwg.save()
        print(f"SVG saved to {output_path}")
    
    def vectorize_image(self, input_path: str, output_path: str) -> dict:
        """Main vectorization pipeline"""
        try:
            # Load and preprocess
            image = self.load_and_preprocess_image(input_path)
            
            # Color analysis
            dominant_colors, labels = self.analyze_colors(image)
            
            # Edge detection
            edges = self.detect_edges(image)
            
            # Extract contours
            contours = self.extract_contours(edges)
            
            # Create SVG
            self.create_svg(image, contours, dominant_colors, labels, output_path)
            
            return {
                "success": True,
                "input_path": input_path,
                "output_path": output_path,
                "image_size": image.shape[:2],
                "colors_found": len(dominant_colors),
                "contours_found": len(contours)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "input_path": input_path,
                "output_path": output_path
            }

def main():
    parser = argparse.ArgumentParser(description="Professional Image Vectorization")
    parser.add_argument("input", help="Input image path")
    parser.add_argument("output", help="Output SVG path")
    parser.add_argument("--max-colors", type=int, default=16, help="Maximum number of colors")
    parser.add_argument("--edge-low", type=int, default=50, help="Canny edge detection low threshold")
    parser.add_argument("--edge-high", type=int, default=150, help="Canny edge detection high threshold")
    
    args = parser.parse_args()
    
    # Create vectorizer
    vectorizer = ProfessionalVectorizer(
        max_colors=args.max_colors,
        edge_threshold_low=args.edge_low,
        edge_threshold_high=args.edge_high
    )
    
    # Vectorize image
    result = vectorizer.vectorize_image(args.input, args.output)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))
    
    if result["success"]:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
