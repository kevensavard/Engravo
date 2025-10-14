import { NextRequest, NextResponse } from "next/server";
import {
  loadImageBuffer,
  cartoonize,
  saveBuffer,
  getImageMetadata,
} from "@/lib/image-processor";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    const buffer = await loadImageBuffer(imageUrl);
    const processedBuffer = await cartoonize(buffer);
    const metadata = await getImageMetadata(processedBuffer);

    const timestamp = Date.now();
    const filename = `${timestamp}-cartoon.png`;
    const url = await saveBuffer(processedBuffer, filename);

    return NextResponse.json({
      url,
      filename,
      width: metadata.width,
      height: metadata.height,
    });
  } catch (error) {
    console.error("Cartoonize error:", error);
    return NextResponse.json(
      { error: "Failed to cartoonize image" },
      { status: 500 }
    );
  }
}

