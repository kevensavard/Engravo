# Quick Start Guide - Laser Engraving Studio

## Getting Started in 2 Minutes

### 1. Start the Development Server
The server should already be running on `http://localhost:3000`. If not:

```bash
npm run dev
```

### 2. Open Your Browser
Navigate to: **http://localhost:3000**

You should see the Laser Engraving Studio interface with:
- Header: "Laser Engraving Studio"
- Upload area with "Choose Image" button

---

## Testing the Features

### Step 1: Upload an Image
1. Click "Choose Image" button
2. Select any JPG, PNG, or GIF image from your computer
3. Image should appear in the preview area
4. You'll see Undo, Redo, and Download buttons appear

### Step 2: Try Basic Tools

#### Grayscale
- Click "Basic" tab (if not already selected)
- Find "Grayscale" tool
- Click "Apply" button
- Image converts to black and white instantly

#### Resize
- Find "Resize" tool
- Enter new dimensions (e.g., 800x600)
- Click "Apply"
- Image resizes to new dimensions

#### Crop
- Find "Crop" tool
- Enter crop parameters (x, y, width, height)
- Example: x=0, y=0, width=400, height=400
- Click "Apply"
- Image crops to specified region

#### Color Correction
- Find "Color Correction" tool
- Adjust sliders for:
  - Brightness (0.5 to 2.0)
  - Contrast (0.5 to 2.0)
  - Saturation (0 to 2.0)
- Click "Apply"
- See color changes applied

#### Sharpen
- Find "Sharpen" tool
- Click "Apply"
- Image sharpness enhanced

### Step 3: Try Advanced Tools

Click the **"Advanced"** tab to access:

#### Add Text
- Enter text (e.g., "Laser Engraving")
- Set font size (e.g., 48)
- Set position (x, y coordinates)
- Choose color (use color picker)
- Click "Apply"
- Text appears on image

#### Mask Shape
- Select shape: Circle, Rectangle, or Ellipse
- Set position and size
- Click "Apply"
- Image masked to selected shape

#### Slice Image
- Enter number of rows (e.g., 2)
- Enter number of columns (e.g., 2)
- Click "Apply"
- Image divided into tiles

#### Puzzle Generator
- Set number of pieces (e.g., 12)
- Adjust corner radius slider (0-20)
- Click "Generate Puzzle"
- Creates puzzle layout with numbered pieces

### Step 4: Try Effects

Click the **"Effects"** tab to access:

#### Remove Background
- Click "Apply" under "Remove Background"
- Background becomes transparent
- Works best on high-contrast images

#### Cartoonize
- Click "Apply" under "Cartoonize"
- Image gets cartoon-style effect
- Colors become more vibrant, edges enhanced

#### AI Upscale
- Select scale factor: 2x or 4x
- Click "Upscale"
- Image resolution increases
- Takes a few seconds

#### Vectorize (SVG)
- Click "Apply" under "Vectorize (SVG)"
- Converts image to vector format
- Perfect for laser cutting
- Downloads as SVG file

#### Depth Map
- Adjust detail level slider (0-100%)
- Higher = more detail
- Lower = smoother gradients
- Click "Generate Depth Map"
- Creates grayscale depth map for 3D engraving

---

## Testing Undo/Redo

1. Apply any tool
2. Click "Undo" button - reverts to previous state
3. Click "Redo" button - reapplies the change
4. You can undo multiple steps back through history

---

## Downloading Results

1. After processing, click the "Download" button
2. Image downloads with auto-generated filename
3. Format: `[timestamp]-[operation].png`

---

## Sample Workflow: Complete Laser Engraving Prep

Here's a typical workflow for preparing an image:

1. **Upload** your photo
2. **Resize** to desired dimensions (e.g., 1000x1000)
3. **Grayscale** for laser compatibility
4. **Color Correct** to adjust contrast
5. **Sharpen** for better detail
6. **Add Text** if needed (name, date, etc.)
7. **Download** final result

### For Puzzle Creation:
1. **Upload** image
2. **Resize** to desired size
3. **Puzzle Generator** with desired piece count
4. **Download** puzzle template

### For 3D Engraving:
1. **Upload** image
2. **Grayscale** conversion
3. **Depth Map** with high detail (80-100%)
4. **Download** depth map

### For Vector Cutting:
1. **Upload** image (simple logo works best)
2. **Grayscale** conversion
3. **Vectorize** to SVG
4. **Download** SVG file

---

## Troubleshooting

### Image Not Uploading
- Check file size (should be < 10MB)
- Verify file type (JPG, PNG, GIF supported)
- Check browser console for errors

### Processing Takes Too Long
- Large images take longer
- Try resizing first to smaller dimensions
- Some operations (upscale, vectorize) are inherently slow

### Error Messages
- Refresh the page and try again
- Check that uploads directory exists
- Verify all dependencies installed correctly

### Canvas Not Showing Image
- Wait for processing to complete (spinner shows processing)
- Check network tab for API errors
- Verify API routes are working

---

## Quick Testing Commands

### Check if server is running:
```bash
curl http://localhost:3000
```

### Check API endpoint:
```bash
curl -X POST http://localhost:3000/api/upload
```

### View uploaded images:
Navigate to: `http://localhost:3000/uploads/`

---

## Feature Testing Checklist

Use this checklist to verify all features work:

### Basic Operations
- [ ] Upload image
- [ ] Grayscale conversion
- [ ] Resize image
- [ ] Crop image
- [ ] Sharpen image
- [ ] Color correction (brightness, contrast, saturation)

### Advanced Operations
- [ ] Add text to image
- [ ] Apply shape mask (circle, rectangle, ellipse)
- [ ] Slice image into grid
- [ ] Generate puzzle pieces

### Effects
- [ ] Remove background
- [ ] Cartoonize image
- [ ] Upscale 2x
- [ ] Upscale 4x
- [ ] Vectorize to SVG
- [ ] Generate depth map

### UI Features
- [ ] Undo operation
- [ ] Redo operation
- [ ] Download result
- [ ] Tab switching (Basic/Advanced/Effects)
- [ ] Responsive layout on mobile

---

## Sample Images for Testing

### Best Images for Each Feature:

**Grayscale/Color Correction**: Any photo
**Crop/Resize**: Any image
**Sharpen**: Slightly blurry photos
**Text Overlay**: Landscape photos, product images
**Mask Shape**: Portraits (circular mask)
**Puzzle**: Any photo with interesting content
**Remove Background**: Product photos with solid backgrounds
**Cartoonize**: Photos with clear subjects
**Upscale**: Small logos or icons
**Vectorize**: Simple logos, line art (not complex photos)
**Depth Map**: Photos with depth (landscapes, portraits)

---

## Development Tips

### Viewing Processed Images
All processed images are saved in:
```
public/uploads/
```

You can view them directly at:
```
http://localhost:3000/uploads/[filename]
```

### Clearing Cache
If you need to clear processed images:
```bash
# Windows PowerShell
Remove-Item public\uploads\* -Force

# Or manually delete files in public/uploads/
```

### Checking Logs
Server logs appear in the terminal where you ran `npm run dev`

Look for:
- Upload success messages
- Processing errors
- API route errors

---

## Next Steps After Testing

Once you've verified everything works:

1. **For Development**:
   - Add more features
   - Customize UI/styling
   - Implement ML models (if build tools available)

2. **For Production**:
   - Set up cloud storage (S3/GCS)
   - Configure environment variables
   - Add authentication
   - Deploy to Vercel/AWS/Azure

3. **For Business**:
   - Integrate Stripe for payments
   - Create user dashboard
   - Add subscription tiers
   - Market to laser engraving businesses

---

## Getting Help

### Documentation Files
- `README.md` - Comprehensive overview
- `TECHNICAL_NOTES.md` - Implementation details
- `IMPLEMENTATION_STATUS.md` - Feature completion status

### Common Issues
1. **Port already in use**: Kill the process on port 3000
2. **Dependencies error**: Run `npm install` again
3. **Sharp errors**: May need to rebuild: `npm rebuild sharp`
4. **Canvas errors**: May need to rebuild: `npm rebuild canvas`

---

## Have Fun Testing! 🎨🔥

The application is fully functional and ready to use. Try out all the features and see what amazing things you can create for laser engraving!

**Pro Tip**: Start with simple operations (grayscale, resize) then move to complex ones (puzzle, depth maps) to get a feel for the processing times.

