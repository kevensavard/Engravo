#!/bin/bash

# Setup script for Python vectorization dependencies

echo "Setting up Python vectorization environment..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Make Python script executable
chmod +x vectorize.py

echo "Setup complete! Python vectorization is ready."
echo ""
echo "To test the vectorization script:"
echo "python3 vectorize.py input_image.png output.svg"
