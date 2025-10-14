# Technical Implementation Notes

## Overview
This document contains technical details about the implementation of the Laser Engraving Studio web application.

## Architecture Decisions

### Server-Side Processing
All image processing operations are performed server-side via Next.js API routes. This approach provides:
- Consistent results across different client devices
- Access to powerful Node.js libraries (Sharp, Canvas)
- Better performance for heavy operations
- Ability to handle large images without browser limitations

### Image Processing Libraries

#### Sharp
Primary library for image manipulation operations:
- **Performance**: Up to 10x faster than ImageMagick
- **Memory efficiency**: Processes images in streams
- **Operations**: Resize, crop, color corrections, filters
- **Format support**: JPEG, PNG, WebP, TIFF, GIF, SVG

#### node-canvas
Used for drawing operations that require Canvas API:
- **Text rendering**: Custom fonts, colors, positioning
- **Shape masking**: Circles, rectangles, ellipses
- **Puzzle generation**: Drawing grid lines and piece numbers
- **Native performance**: Backed by Cairo graphics library

#### Potrace
Bitmap tracing for vectorization:
- **Algorithm**: Peter Selinger's potrace algorithm
- **Output**: Clean SVG paths optimized for laser cutting
- **Customizable**: Threshold, curve optimization, corner detection

## ML Feature Implementation

### Current Approach
Due to Windows compatibility issues with TensorFlow.js-node (requires Visual Studio C++ build tools), we implemented algorithmic alternatives:

#### Background Removal
- **Method**: Threshold-based transparency with edge preservation
- **Algorithm**: 
  1. Convert to RGBA with alpha channel
  2. Calculate brightness for each pixel
  3. Apply threshold to determine transparency
  4. Preserve edge details
- **Limitations**: Works best on high-contrast images with uniform backgrounds
- **Future**: Can be replaced with U2-Net or RMBG models

#### Depth Map Generation
- **Method**: Gradient-based depth estimation
- **Algorithm**:
  1. Convert to grayscale
  2. Apply variable blur based on detail level
  3. Enhance contrast with normalization
  4. Generate depth gradients
- **Parameters**: Detail level (0-100%) controls blur amount
- **Future**: Can be upgraded to MiDaS or DPT models

#### Cartoonization
- **Method**: Edge detection + color quantization
- **Algorithm**:
  1. Apply median filter to reduce noise
  2. Detect edges using convolution
  3. Quantize colors
  4. Enhance saturation
- **Future**: Can add bilateral filtering for better results

#### AI Upscaling
- **Method**: Lanczos3 interpolation with sharpening
- **Algorithm**:
  1. Resize using high-quality Lanczos3 kernel
  2. Apply sharpening filter
  3. Support 2x and 4x scaling
- **Limitations**: Not true AI super-resolution
- **Future**: Can integrate ESRGAN or Real-ESRGAN models

### Upgrading to True ML

To implement proper ML-based features, you would need to:

1. **Install TensorFlow.js-node** (requires C++ build tools):
   ```bash
   npm install @tensorflow/tfjs-node
   ```

2. **Download pre-trained models**:
   - Background Removal: U2-Net, RMBG, or MODNet
   - Depth Estimation: MiDaS v3.1 or DPT
   - Super Resolution: ESRGAN, Real-ESRGAN

3. **Load models in API routes**:
   ```typescript
   import * as tf from '@tensorflow/tfjs-node';
   
   let model;
   async function loadModel() {
     if (!model) {
       model = await tf.loadGraphModel('path/to/model');
     }
     return model;
   }
   ```

4. **Process images with models**:
   ```typescript
   const model = await loadModel();
   const tensor = tf.node.decodeImage(imageBuffer);
   const prediction = model.predict(tensor);
   const output = await tf.node.encodeJpeg(prediction);
   ```

## Puzzle Generation Algorithm

### Grid Calculation
```typescript
// Calculate optimal grid for N pieces
const aspectRatio = width / height;
const cols = Math.ceil(Math.sqrt(numPieces * aspectRatio));
const rows = Math.ceil(numPieces / cols);
```

### Features
- Automatic grid optimization based on image aspect ratio
- Rounded corners using quadratic bezier curves
- Numbered pieces for assembly guidance
- SVG export for laser cutting templates

### Future Enhancements
- Interlocking puzzle pieces (jigsaw style)
- Custom piece shapes
- Irregular piece sizes
- Export individual pieces as separate files

## Performance Considerations

### Memory Usage
- Sharp processes images in streams, reducing memory footprint
- Large images (>10MP) may require additional server RAM
- Consider resizing very large images before processing

### Processing Time
Operation complexity and typical processing times:
- **Fast** (<1s): Grayscale, crop, resize, sharpen, color correction
- **Medium** (1-3s): Add text, mask shape, puzzle generation
- **Slow** (3-10s): Cartoonize, upscale, vectorize
- **Very Slow** (10-30s): Background removal (with ML), depth maps (with ML)

### Optimization Strategies
1. **Caching**: Store processed images in `/public/uploads`
2. **Worker Threads**: Offload heavy operations to worker threads
3. **Job Queue**: Implement Bull or BullMQ for async processing
4. **CDN**: Serve processed images from CDN in production
5. **Compression**: Use WebP format for smaller file sizes

## File Upload Handling

### Current Implementation
- Files are uploaded via multipart/form-data
- Converted to Buffer for processing
- Saved to `/public/uploads` directory
- Accessible via `/uploads/[filename]` URL

### Production Considerations
- **Storage**: Use S3, Google Cloud Storage, or similar
- **File Size Limits**: Currently no limit, should add validation
- **File Type Validation**: Add MIME type checking
- **Virus Scanning**: Implement ClamAV or similar
- **Rate Limiting**: Prevent abuse with rate limiting

## API Design

### Endpoint Pattern
All endpoints follow the same pattern:
```typescript
POST /api/[operation]
Body: { imageUrl, ...params }
Response: { url, filename, width, height, ...metadata }
```

### Error Handling
- 400: Bad request (missing parameters)
- 500: Server error (processing failed)
- Returns JSON with error message

### Future Improvements
- Add request validation with Zod
- Implement request logging
- Add authentication/authorization
- Implement rate limiting
- Add webhook support for long operations

## UI/UX Design

### Component Structure
- **ImageEditor**: Main container component
- **Tool Sections**: Grouped by category (Basic, Advanced, Effects)
- **Tool Components**: Individual tools with their own state
- **Canvas**: Preview area for processed images

### State Management
- **Local State**: React useState for component state
- **History**: Array-based undo/redo system
- **Image State**: Tracks URL, filename, dimensions

### Future Enhancements
- Add before/after comparison slider
- Implement layer system
- Add keyboard shortcuts
- Create preset workflows
- Add batch processing UI

## Testing Strategy

### Manual Testing
1. Upload various image formats (JPEG, PNG, GIF)
2. Test each tool with different parameters
3. Verify undo/redo functionality
4. Test download functionality
5. Check error handling

### Automated Testing (Future)
- Unit tests for lib functions
- Integration tests for API routes
- E2E tests with Playwright/Cypress
- Visual regression tests

## Deployment

### Environment Variables (Future)
```env
# Storage
STORAGE_PROVIDER=local|s3|gcs
S3_BUCKET=your-bucket
S3_REGION=us-east-1

# ML Models
MODEL_PATH=/path/to/models
ENABLE_ML_FEATURES=true

# Security
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png
```

### Production Checklist
- [ ] Configure cloud storage (S3/GCS)
- [ ] Set up CDN for image delivery
- [ ] Implement rate limiting
- [ ] Add file size and type validation
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Optimize image serving (WebP, responsive images)
- [ ] Implement job queue for async processing
- [ ] Set up error tracking (Sentry)
- [ ] Configure security headers

## Known Limitations

1. **TensorFlow.js**: Doesn't work on Windows without C++ build tools
2. **Background Removal**: Current implementation is basic, works best on simple backgrounds
3. **Depth Maps**: Algorithmic approach is not as accurate as ML models
4. **Upscaling**: Not true AI super-resolution
5. **File Storage**: Currently local filesystem, needs cloud storage for production
6. **Processing Time**: Long operations block the API route
7. **No Authentication**: All features are publicly accessible

## Recommended Next Steps

1. **Immediate**:
   - Add file size and type validation
   - Implement proper error handling
   - Add loading progress indicators

2. **Short Term**:
   - Set up cloud storage (S3/GCS)
   - Implement job queue for async processing
   - Add authentication and user accounts

3. **Long Term**:
   - Integrate proper ML models (if possible)
   - Build subscription system with Stripe
   - Add collaborative features
   - Create mobile app

## Resources

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [node-canvas Documentation](https://github.com/Automattic/node-canvas)
- [Potrace Documentation](https://www.npmjs.com/package/potrace)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TensorFlow.js Models](https://www.tensorflow.org/js/models)

