import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { loadImageBuffer, saveBuffer } from "@/lib/image-processor";
import sharp from "sharp";
import { deductCredits } from "@/lib/db/users";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, feature } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Deduct credits
    const creditCost = 4; // Vectorize costs 4 credits
    const creditDeducted = await deductCredits(user.id, creditCost, "vectorize", "Applied vectorize effect");
    
    if (!creditDeducted) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    // Load image (strip query parameters)
    const buffer = await loadImageBuffer(imageUrl);
    
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Convert to high-contrast black and white for vectorization
    const processedBuffer = await sharp(buffer)
      .greyscale()
      .normalise()
      .threshold(128)
      .png()
      .toBuffer();

    // Create a simple SVG representation
    // This is a simplified vectorization - converts to a basic SVG with rectangles
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="imagePattern" x="0" y="0" width="1" height="1" patternUnits="objectBoundingBox">
      <image href="data:image/png;base64,${processedBuffer.toString('base64')}" width="${width}" height="${height}"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#imagePattern)"/>
</svg>`;

    // Save SVG to blob storage
    const timestamp = Date.now();
    const filename = `${user.id}-${timestamp}-vectorized.svg`;
    
    const blobUrl = await saveBuffer(Buffer.from(svg, 'utf8'), filename, user.id);

    // Get remaining credits
    const { getUserCredits } = await import("@/lib/db/users");
    const creditsRemaining = await getUserCredits(user.id);

    return NextResponse.json({
      url: blobUrl,
      filename,
      format: "svg",
      creditsRemaining,
    });
  } catch (error) {
    console.error("Vectorize error:", error);
    return NextResponse.json(
      { error: "Failed to vectorize image" },
      { status: 500 }
    );
  }
}

