import { NextRequest, NextResponse } from "next/server";
import { loadImageBuffer } from "@/lib/image-processor";
import { generatePuzzleSVG } from "@/lib/puzzle-generator";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, pieces = 12, showNumbers = true } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    // Load image to get dimensions
    const buffer = await loadImageBuffer(imageUrl);
    const sharp = require("sharp");
    const metadata = await sharp(buffer).metadata();
    
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Generate SVG puzzle template
    const svgContent = generatePuzzleSVG(width, height, pieces, 2);

    // Create filename with timestamp
    const timestamp = Date.now();
    const filename = `puzzle-template-${pieces}pieces-${timestamp}.svg`;

    // Return the SVG content for download
    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Puzzle SVG generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate puzzle SVG template" },
      { status: 500 }
    );
  }
}
