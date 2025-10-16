import json
import base64
import tempfile
import os
from http.server import BaseHTTPRequestHandler

# Import our vectorization module
import sys
sys.path.append('/var/task')
from vectorize import ProfessionalVectorizer

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Get content length
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Parse JSON data
            data = json.loads(post_data.decode('utf-8'))
            
            # Get image data
            if 'image_data' not in data:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No image data provided'}).encode())
                return
            
            # Decode base64 image data
            image_data = base64.b64decode(data['image_data'])
            
            # Create temporary files
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as input_file:
                input_file.write(image_data)
                input_path = input_file.name
            
            with tempfile.NamedTemporaryFile(suffix='.svg', delete=False) as output_file:
                output_path = output_file.name
            
            try:
                # Run vectorization
                vectorizer = ProfessionalVectorizer(max_colors=16)
                result = vectorizer.vectorize_image(input_path, output_path)
                
                if result['success']:
                    # Read the generated SVG
                    with open(output_path, 'r') as f:
                        svg_content = f.read()
                    
                    # Send success response
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    
                    response = {
                        'success': True,
                        'svg_content': svg_content,
                        'metadata': {
                            'image_size': result['image_size'],
                            'colors_found': result['colors_found'],
                            'contours_found': result['contours_found']
                        }
                    }
                    
                    self.wfile.write(json.dumps(response).encode())
                else:
                    # Send error response
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': result['error']}).encode())
            
            finally:
                # Clean up temporary files
                try:
                    os.unlink(input_path)
                    os.unlink(output_path)
                except:
                    pass
        
        except Exception as e:
            # Send error response
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
