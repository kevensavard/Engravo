import { NextRequest, NextResponse } from "next/server";
import {
  loadImageBuffer,
  resizeImage,
  saveBuffer,
  getImageMetadata,
} from "@/lib/image-processor";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, width, height } = await request.json();

    if (!imageUrl || !width || !height) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const buffer = await loadImageBuffer(imageUrl);
    const processedBuffer = await resizeImage(buffer, width, height);
    const metadata = await getImageMetadata(processedBuffer);

    const timestamp = Date.now();
    const filename = `${timestamp}-resized.png`;
    const url = await saveBuffer(processedBuffer, filename);

    return NextResponse.json({
      url,
      filename,
      width: metadata.width,
      height: metadata.height,
    });
  } catch (error) {
    console.error("Resize error:", error);
    return NextResponse.json(
      { error: "Failed to resize image" },
      { status: 500 }
    );
  }
}

