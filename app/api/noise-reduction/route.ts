import { NextRequest, NextResponse } from "next/server";
import {
  loadImageBuffer,
  noiseReduction,
  saveBuffer,
  getImageMetadata,
} from "@/lib/image-processor";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, strength = 0.5 } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    const buffer = await loadImageBuffer(imageUrl);
    const processedBuffer = await noiseReduction(buffer, strength);
    const metadata = await getImageMetadata(processedBuffer);

    const timestamp = Date.now();
    const filename = `${timestamp}-noise-reduced.png`;
    const url = await saveBuffer(processedBuffer, filename);

    return NextResponse.json({
      url,
      filename,
      width: metadata.width,
      height: metadata.height,
      strength,
    });
  } catch (error) {
    console.error("Noise reduction error:", error);
    return NextResponse.json(
      { error: "Failed to apply noise reduction" },
      { status: 500 }
    );
  }
}
