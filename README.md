# Laser Engraving Studio - Image Editor

A comprehensive web application for preparing images for laser engraving with professional-grade image processing tools.

## Features

### Basic Image Operations
- **Grayscale Conversion** - Convert images to grayscale for laser engraving
- **Resize** - Adjust image dimensions with custom width and height
- **Crop** - Crop images to specific regions with precise controls
- **Sharpen** - Enhance image sharpness for better detail
- **Color Correction** - Adjust brightness, contrast, and saturation

### Advanced Tools
- **Add Text** - Overlay text on images with custom fonts, sizes, colors, and positioning
- **Mask Shapes** - Apply circular, rectangular, or elliptical masks to images
- **Slice Images** - Split images into grid-based tiles for large projects
- **Puzzle Generator** - Create laser-cuttable puzzle pieces with customizable piece count and corner radius

### Effects & AI Features
- **Remove Background** - Automatic background removal using edge detection
- **Cartoonize** - Apply cartoon-style effects with edge detection and color quantization
- **AI Upscale** - Enhance image resolution with 2x or 4x scaling
- **Vectorize (SVG)** - Convert raster images to vector SVG format for laser cutting
- **Depth Map** - Generate depth maps for 3D engraving with adjustable detail levels

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling with Tailwind v4
- **shadcn/ui** - Beautiful and accessible UI components
- **Sharp** - High-performance image processing
- **node-canvas** - Server-side canvas rendering for text and shapes
- **Potrace** - Bitmap tracing for SVG vectorization
- **Jimp** - Additional image manipulation capabilities

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd laser
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Upload an Image** - Click "Choose Image" to upload your photo
2. **Select a Tool** - Choose from Basic, Advanced, or Effects tabs
3. **Adjust Parameters** - Customize settings for each tool
4. **Apply** - Process your image with the selected tool
5. **Undo/Redo** - Navigate through your editing history
6. **Download** - Save your processed image

## Project Structure

```
laser/
├── app/
│   ├── api/              # API routes for image processing
│   │   ├── upload/       # File upload endpoint
│   │   ├── grayscale/    # Grayscale conversion
│   │   ├── resize/       # Image resizing
│   │   ├── crop/         # Image cropping
│   │   ├── sharpen/      # Image sharpening
│   │   ├── color-correct/# Color adjustments
│   │   ├── add-text/     # Text overlay
│   │   ├── mask-shape/   # Shape masking
│   │   ├── slice/        # Image slicing
│   │   ├── puzzle/       # Puzzle generation
│   │   ├── remove-bg/    # Background removal
│   │   ├── cartoonize/   # Cartoon effect
│   │   ├── upscale/      # AI upscaling
│   │   ├── vectorize/    # SVG conversion
│   │   └── depth-map/    # Depth map generation
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page
│   └── globals.css       # Global styles
├── components/
│   ├── ImageEditor.tsx   # Main editor component
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── image-processor.ts  # Sharp-based image processing
│   ├── puzzle-generator.ts # Puzzle generation logic
│   └── utils.ts           # Utility functions
└── public/
    └── uploads/          # Processed images storage
```

## API Routes

All API routes accept POST requests with JSON payloads:

### POST /api/upload
Upload an image file
- Body: FormData with `file` field
- Returns: `{ url, filename, width, height, format, size }`

### POST /api/grayscale
Convert image to grayscale
- Body: `{ imageUrl }`
- Returns: `{ url, filename, width, height }`

### POST /api/resize
Resize image
- Body: `{ imageUrl, width, height }`
- Returns: `{ url, filename, width, height }`

### POST /api/crop
Crop image
- Body: `{ imageUrl, x, y, width, height }`
- Returns: `{ url, filename, width, height }`

### POST /api/color-correct
Adjust colors
- Body: `{ imageUrl, brightness, contrast, saturation }`
- Returns: `{ url, filename, width, height }`

### POST /api/add-text
Add text overlay
- Body: `{ imageUrl, text, x, y, fontSize, color }`
- Returns: `{ url, filename, width, height }`

### POST /api/puzzle
Generate puzzle
- Body: `{ imageUrl, pieces, cornerRadius }`
- Returns: `{ url, filename, width, height, pieces }`

### POST /api/depth-map
Generate depth map
- Body: `{ imageUrl, detail }` (detail: 0-100)
- Returns: `{ url, filename, width, height, detail }`

### POST /api/vectorize
Convert to SVG
- Body: `{ imageUrl }`
- Returns: `{ url, filename, format }`

## Features in Detail

### Puzzle Generator
Creates laser-cuttable puzzle templates with:
- Customizable piece count (automatically calculates optimal grid)
- Corner radius adjustment for rounded edges
- Numbered pieces for easy assembly
- Can generate SVG templates for precise laser cutting

### Depth Map Generation
Generates grayscale depth maps for 3D laser engraving:
- Detail percentage control (0-100%)
- Higher detail preserves fine features
- Lower detail creates smoother gradients
- Perfect for 3D relief engraving

### Vectorization
Converts raster images to vector SVG format:
- Uses potrace algorithm for bitmap tracing
- Optimizes for laser cutting
- Adjustable threshold for detail control
- Exports clean SVG paths

### Background Removal
Removes backgrounds using edge detection:
- Threshold-based transparency
- Works best with high-contrast images
- Preserves edge details

## Development Notes

### Image Processing
All image processing happens server-side using Node.js libraries:
- **Sharp** - Fast, efficient image operations
- **node-canvas** - Canvas API for drawing and text
- **Potrace** - SVG vectorization

### ML Features
Current ML features (background removal, depth maps) use algorithmic approaches:
- Edge detection for background removal
- Gradient analysis for depth mapping
- Can be enhanced with proper ML models (TensorFlow, PyTorch) in the future

### Performance
- Images are processed on-demand
- Processed images are cached in `/public/uploads`
- Consider implementing a job queue (Bull, BullMQ) for production
- Large images may require additional server resources

## Future Enhancements

- [ ] Implement true ML-based background removal (U2-Net, RMBG)
- [ ] Add proper ML depth estimation (MiDaS, DPT)
- [ ] Implement job queue for long-running operations
- [ ] Add batch processing capabilities
- [ ] Create user authentication and project management
- [ ] Integrate Stripe for subscription payments
- [ ] Add export presets for different laser engravers
- [ ] Implement collaborative editing
- [ ] Add cloud storage integration

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
