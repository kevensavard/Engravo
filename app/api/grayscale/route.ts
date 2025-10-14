import { NextRequest, NextResponse } from "next/server";
import {
  loadImageBuffer,
  convertToGrayscale,
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
    const processedBuffer = await convertToGrayscale(buffer);
    const metadata = await getImageMetadata(processedBuffer);

    const timestamp = Date.now();
    const filename = `${timestamp}-grayscale.png`;
    const url = await saveBuffer(processedBuffer, filename);

    return NextResponse.json({
      url,
      filename,
      width: metadata.width,
      height: metadata.height,
    });
  } catch (error) {
    console.error("Grayscale error:", error);
    return NextResponse.json(
      { error: "Failed to convert to grayscale" },
      { status: 500 }
    );
  }
}

