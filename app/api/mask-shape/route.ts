import { NextRequest, NextResponse } from "next/server";
import {
  loadImageBuffer,
  maskShape,
  saveBuffer,
  getImageMetadata,
} from "@/lib/image-processor";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, shape, x, y, width, height } = await request.json();

    if (!imageUrl || !shape || x === undefined || y === undefined || !width || !height) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const buffer = await loadImageBuffer(imageUrl);
    const processedBuffer = await maskShape(buffer, shape, x, y, width, height);
    const metadata = await getImageMetadata(processedBuffer);

    const timestamp = Date.now();
    const filename = `${timestamp}-masked.png`;
    const url = await saveBuffer(processedBuffer, filename);

    return NextResponse.json({
      url,
      filename,
      width: metadata.width,
      height: metadata.height,
    });
  } catch (error) {
    console.error("Mask shape error:", error);
    return NextResponse.json(
      { error: "Failed to apply mask" },
      { status: 500 }
    );
  }
}

