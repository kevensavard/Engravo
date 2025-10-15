import sharp from "sharp";
import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";
import { uploadToBlob, loadImageFromUrl } from "./storage";

export async function saveBuffer(buffer: Buffer, filename: string, userId?: string): Promise<string> {
  // Upload to Vercel Blob and return the URL
  const blobFilename = userId ? `uploads/${userId}/${filename}` : `uploads/${filename}`;
  const url = await uploadToBlob(buffer, blobFilename);
  
  // Track the blob if userId is provided (will be cleaned up on next upload)
  if (userId) {
    const { trackBlob } = await import("./db/blobs");
    await trackBlob(userId, url);
  }
  
  return url;
}

export async function loadImageBuffer(imageUrl: string): Promise<Buffer> {
  // Strip query parameters (like ?t=timestamp) from the URL
  const cleanUrl = imageUrl.split('?')[0];
  console.log("Loading image from URL:", cleanUrl);
  
  try {
    const buffer = await loadImageFromUrl(cleanUrl);
    console.log("Image loaded successfully, size:", buffer.length);
    
    // Validate that this is actually an image by trying to get metadata
    try {
      const testMetadata = await sharp(buffer).metadata();
      console.log("Image validation successful, format:", testMetadata.format);
      return buffer;
    } catch (validationError) {
      console.error("Image validation failed:", validationError);
      throw new Error(`Invalid image file: ${validationError instanceof Error ? validationError.message : String(validationError)}`);
    }
  } catch (error) {
    console.error("Error loading image:", error);
    throw error;
  }
}

export async function convertToGrayscale(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer).grayscale().toBuffer();
}

export async function resizeImage(
  buffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  return await sharp(buffer)
    .resize(width, height, { fit: "fill" })
    .toBuffer();
}

export async function cropImage(
  buffer: Buffer,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Buffer> {
  return await sharp(buffer)
    .extract({ left: x, top: y, width, height })
    .toBuffer();
}

export async function sharpenImage(buffer: Buffer, amount: number = 2): Promise<Buffer> {
  return await sharp(buffer).sharpen(amount).toBuffer();
}

export async function colorCorrect(
  buffer: Buffer,
  brightness: number = 1,
  contrast: number = 1,
  saturation: number = 1
): Promise<Buffer> {
  console.log('Color correction params:', { brightness, contrast, saturation });
  
  return await sharp(buffer)
    .modulate({
      brightness: brightness,
      saturation: saturation,
    })
    .linear(contrast, -(128 * contrast) + 128)
    .toBuffer();
}

export async function addTextToImage(
  buffer: Buffer,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string
): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Load the image onto canvas
  const img = await loadImage(buffer);
  ctx.drawImage(img, 0, 0);

  // Draw text
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  return canvas.toBuffer("image/png");
}

export async function maskShape(
  buffer: Buffer,
  shape: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  const imgWidth = metadata.width || 800;
  const imgHeight = metadata.height || 600;

  const canvas = createCanvas(imgWidth, imgHeight);
  const ctx = canvas.getContext("2d");

  // Load the image onto canvas
  const img = await loadImage(buffer);
  ctx.drawImage(img, 0, 0);

  // Create mask
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = "#ffffff";

  if (shape === "circle") {
    const radius = Math.min(width, height) / 2;
    ctx.beginPath();
    ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === "rectangle") {
    ctx.fillRect(x, y, width, height);
  } else if (shape === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(
      x + width / 2,
      y + height / 2,
      width / 2,
      height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  return canvas.toBuffer("image/png");
}

export async function sliceImage(
  buffer: Buffer,
  rows: number,
  cols: number
): Promise<Buffer[]> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  const sliceWidth = Math.floor(width / cols);
  const sliceHeight = Math.floor(height / rows);

  const slices: Buffer[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const slice = await sharp(buffer)
        .extract({
          left: col * sliceWidth,
          top: row * sliceHeight,
          width: sliceWidth,
          height: sliceHeight,
        })
        .toBuffer();
      slices.push(slice);
    }
  }

  return slices;
}

export async function removeBackground(buffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;
    
    console.log("Remove background: Processing image", width, "x", height);

    // Step 1: Convert to grayscale for edge detection
    const grayBuffer = await sharp(buffer)
      .greyscale()
      .normalise()
      .toBuffer();

    // Step 2: Create a canvas for manual processing
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // Load original image
    const img = await loadImage(buffer);
    ctx.drawImage(img, 0, 0, width, height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Step 3: Simple background removal using corner sampling
    // Sample corners to determine background color
    const corners = [
      { x: 0, y: 0 }, // Top-left
      { x: width - 1, y: 0 }, // Top-right
      { x: 0, y: height - 1 }, // Bottom-left
      { x: width - 1, y: height - 1 }, // Bottom-right
    ];
    
    let bgR = 0, bgG = 0, bgB = 0;
    corners.forEach(corner => {
      const idx = (corner.y * width + corner.x) * 4;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
    });
    
    // Average background color
    bgR = Math.round(bgR / 4);
    bgG = Math.round(bgG / 4);
    bgB = Math.round(bgB / 4);
    
    console.log("Remove background: Detected background color RGB:", bgR, bgG, bgB);
    
    // Step 4: Remove background pixels (make transparent)
    const threshold = 80; // Increased threshold for more aggressive removal
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate color difference from background
      const diff = Math.sqrt(
        Math.pow(r - bgR, 2) + 
        Math.pow(g - bgG, 2) + 
        Math.pow(b - bgB, 2)
      );
      
      // If pixel is similar to background, make it transparent
      if (diff < threshold) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      } else {
        // For pixels that are NOT background, ensure they're fully opaque
        data[i + 3] = 255;
      }
    }
    
    // Step 5: Apply the result
    ctx.putImageData(imageData, 0, 0);
    
    // Step 6: Clean up edges with erosion/dilation
    const result = canvas.toBuffer("image/png");
    
    // Final processing to clean up
    return await sharp(result)
      .ensureAlpha()
      .png()
      .toBuffer();
      
  } catch (error) {
    console.error("Background removal error:", error);
    throw error;
  }
}

export async function cartoonize(buffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Step 1: Strong bilateral filter - smooth colors while preserving edges
    const smoothed = await sharp(buffer)
      .blur(6) // Stronger blur for more cartoon look
      .sharpen({ sigma: 1, flat: 1, jagged: 2 })
      .median(7) // Stronger median filter
      .blur(2) // Light blur to soften
      .toBuffer();

    // Step 2: Color quantization/posterization
    const smoothImg = await loadImage(smoothed);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(smoothImg, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // More aggressive posterization for cartoon effect
    const levels = 4; // Fewer levels for more cartoon-like flat colors
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / 255 * levels) * (255 / levels);
      data[i + 1] = Math.round(data[i + 1] / 255 * levels) * (255 / levels);
      data[i + 2] = Math.round(data[i + 2] / 255 * levels) * (255 / levels);
    }

    ctx.putImageData(imageData, 0, 0);

    // Step 3: Create strong, clean edges
    const edges = await sharp(buffer)
      .greyscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
      })
      .normalise()
      .threshold(40) // Lower threshold for stronger edges
      .negate()
      .toBuffer();

    // Step 4: Apply edges with stronger opacity
    const edgeImg = await loadImage(edges);
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.9; // Stronger edges
    ctx.drawImage(edgeImg, 0, 0);

    const result = canvas.toBuffer("image/png");

    // Step 5: Final cartoon enhancement
    return await sharp(result)
      .modulate({
        saturation: 1.8, // More vibrant colors
        brightness: 1.1  // Slightly brighter
      })
      .sharpen({ sigma: 0.8, flat: 1, jagged: 2 }) // Final sharpening
      .toBuffer();

  } catch (error) {
    console.error("Cartoonization error:", error);
    throw error;
  }
}

export async function upscaleImage(buffer: Buffer, scale: number = 2): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  const newWidth = (metadata.width || 800) * scale;
  const newHeight = (metadata.height || 600) * scale;

  return await sharp(buffer)
    .resize(newWidth, newHeight, {
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen()
    .toBuffer();
}

export async function generateDepthMap(
  buffer: Buffer,
  detailLevel: number = 50
): Promise<Buffer> {
  try {
    console.log("Starting BALANCED depth map with detail preservation, detail:", detailLevel);
    
    // Convert to PNG format first
    const pngBuffer = await sharp(buffer).png().toBuffer();
    
    // BALANCED DEPTH MAP: Smooth gradients + Preserved details
    // Step 1: Create inverted version (like negative film)
    let depthMap = await sharp(pngBuffer)
      .greyscale()
      .negate() // Invert colors
      .png()
      .toBuffer();
    
    // Step 2: Apply moderate smoothing based on detail level
    const detailWeight = detailLevel / 100;
    const smoothingAmount = Math.max(2, 6 * (1 - detailWeight)); // Much less aggressive smoothing
    
    depthMap = await sharp(depthMap)
      .blur(smoothingAmount) // Moderate blur for smooth gradients
      .png()
      .toBuffer();
    
    // Step 3: Apply contrast enhancement for depth perception
    const contrastMultiplier = 1.2 + (detailWeight * 0.3);
    const brightnessAdjust = detailWeight * 15;
    
    depthMap = await sharp(depthMap)
      .linear(contrastMultiplier, brightnessAdjust)
      .png()
      .toBuffer();
    
    // Step 4: Light final smoothing only if detail level is low
    if (detailWeight < 0.7) {
      const finalSmoothing = Math.max(1, 3 * (1 - detailWeight));
      depthMap = await sharp(depthMap)
        .blur(finalSmoothing)
        .png()
        .toBuffer();
    }
    
    // Step 5: Final enhancement
    depthMap = await sharp(depthMap)
      .normalise() // Ensure full range
      .linear(1.1, 0) // Light contrast boost
      .png()
      .toBuffer();
    
    console.log("Balanced depth map with detail preservation completed");
    return depthMap;
      
  } catch (error) {
    console.error("Balanced depth map error:", error);
    throw error;
  }
}

// Oil Painting Effect - Improved Kuwahara filter
export async function oilPainting(buffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    const img = await loadImage(buffer);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const output = new Uint8ClampedArray(data.length);

    // Copy edges to prevent black borders
    for (let i = 0; i < data.length; i++) {
      output[i] = data[i];
    }

    const radius = 5; // Larger radius for more painterly effect
    const intensityLevels = 25; // More levels for better color variation

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const intensityCount = new Array(intensityLevels).fill(0);
        const rSum = new Array(intensityLevels).fill(0);
        const gSum = new Array(intensityLevels).fill(0);
        const bSum = new Array(intensityLevels).fill(0);

        // Sample in a circular pattern for more organic look
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radius * radius) { // Circular sampling
              const nx = x + dx;
              const ny = y + dy;
              const idx = (ny * width + nx) * 4;
              
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const intensity = Math.floor(((r + g + b) / 3) * intensityLevels / 255);
              
              intensityCount[intensity]++;
              rSum[intensity] += r;
              gSum[intensity] += g;
              bSum[intensity] += b;
            }
          }
        }

        let maxIndex = 0;
        for (let i = 1; i < intensityLevels; i++) {
          if (intensityCount[i] > intensityCount[maxIndex]) {
            maxIndex = i;
          }
        }

        if (intensityCount[maxIndex] > 0) {
          const outIdx = (y * width + x) * 4;
          output[outIdx] = rSum[maxIndex] / intensityCount[maxIndex];
          output[outIdx + 1] = gSum[maxIndex] / intensityCount[maxIndex];
          output[outIdx + 2] = bSum[maxIndex] / intensityCount[maxIndex];
          output[outIdx + 3] = data[outIdx + 3]; // Preserve original alpha
        }
      }
    }

    const outputImageData = ctx.createImageData(width, height);
    outputImageData.data.set(output);
    ctx.putImageData(outputImageData, 0, 0);

    const result = canvas.toBuffer("image/png");

    // Add slight texture and color enhancement
    return await sharp(result)
      .modulate({
        saturation: 1.2,
        brightness: 1.05
      })
      .sharpen({ sigma: 0.3 })
      .toBuffer();
  } catch (error) {
    console.error("Oil painting error:", error);
    throw error;
  }
}

// Sketch/Pencil Drawing Effect - Simple Sharp Implementation (Preserves Alpha)
export async function sketch(buffer: Buffer): Promise<Buffer> {
  try {
    const originalMetadata = await sharp(buffer).metadata();
    const hasAlpha = originalMetadata.channels === 4;

    // Step 1: Convert to grayscale and enhance contrast
    const grayBuffer = await sharp(buffer)
      .greyscale()
      .normalise()
      .linear(1.2, -15)
      .toBuffer();

    // Step 2: Create edge detection
    const edges = await sharp(grayBuffer)
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
      })
      .normalise()
      .threshold(80)
      .negate()
      .toBuffer();

    // Step 3: Create shading layer (inverted grayscale for pen pressure effect)
    const shading = await sharp(grayBuffer)
      .negate()
      .blur(3)
      .normalise()
      .linear(0.7, 15)
      .toBuffer();

    // Step 4: Simple approach - combine everything using Sharp operations
    // Start with white background, then apply effects
    let result = await sharp(buffer)
      .greyscale() // Convert to grayscale
      .normalise() // Normalize
      .linear(1.1, 10) // Slight contrast boost
      .toBuffer();

    // Apply edge detection as overlay
    result = await sharp(result)
      .composite([{
        input: edges,
        blend: 'multiply',
        opacity: 0.8
      }])
      .toBuffer();

    // Apply shading as overlay
    result = await sharp(result)
      .composite([{
        input: shading,
        blend: 'multiply',
        opacity: 0.3
      }])
      .toBuffer();

    // Final enhancement
    return await sharp(result)
      .modulate({ brightness: 1.1 })
      .png() // Ensure PNG format to preserve alpha
      .toBuffer();

  } catch (error) {
    console.error("Sketch error:", error);
    throw error;
  }
}

// Vintage/Retro Effect
export async function vintage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .modulate({
        saturation: 0.7,
        brightness: 0.95
      })
      .tint({ r: 255, g: 240, b: 220 }) // Warm sepia tone
      .linear(0.9, 10) // Reduce contrast, lift shadows
      .sharpen({ sigma: 0.5 })
      .toBuffer();
  } catch (error) {
    console.error("Vintage error:", error);
    throw error;
  }
}

// HDR Effect
export async function hdr(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .normalise() // Auto levels
      .linear(1.3, -20) // Increase contrast
      .modulate({
        saturation: 1.3,
        brightness: 1.05
      })
      .sharpen({ sigma: 1 })
      .toBuffer();
  } catch (error) {
    console.error("HDR error:", error);
    throw error;
  }
}

// Noise Reduction Effect
export async function noiseReduction(buffer: Buffer, strength: number = 0.5): Promise<Buffer> {
  try {
    // Apply different noise reduction techniques based on strength
    let processedBuffer = buffer;
    
    if (strength <= 0.3) {
      // Light noise reduction - subtle blur
      processedBuffer = await sharp(buffer)
        .blur(0.5)
        .sharpen({ sigma: 0.5, m1: 1, m2: 2, x1: 2, y2: 10 })
        .toBuffer();
    } else if (strength <= 0.7) {
      // Medium noise reduction - bilateral-like filter
      processedBuffer = await sharp(buffer)
        .blur(1)
        .sharpen({ sigma: 1, m1: 1, m2: 2, x1: 2, y2: 10 })
        .toBuffer();
    } else {
      // Strong noise reduction - more aggressive smoothing
      processedBuffer = await sharp(buffer)
        .blur(1.5)
        .modulate({ brightness: 1.02, contrast: 1.1 })
        .sharpen({ sigma: 1.5, m1: 1, m2: 2, x1: 2, y2: 10 })
        .toBuffer();
    }
    
    return processedBuffer;
  } catch (error) {
    console.error("Noise reduction error:", error);
    throw error;
  }
}

export async function getImageMetadata(buffer: Buffer) {
  try {
    // Since all our functions now return proper PNG buffers, this should work
    const metadata = await sharp(buffer).metadata();
    console.log("Metadata extracted successfully:", metadata.format, metadata.width, "x", metadata.height);
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'png',
      size: buffer.length,
    };
  } catch (error) {
    console.error("Error getting image metadata:", error);
    throw new Error(`Invalid image format: ${error.message}`);
  }
}


