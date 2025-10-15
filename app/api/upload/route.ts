import { NextRequest, NextResponse } from "next/server";
import { getImageMetadata } from "@/lib/image-processor";
import { uploadToBlob } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get metadata
    const metadata = await getImageMetadata(buffer);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `uploads/${timestamp}-${file.name}`;

    // Upload to Vercel Blob
    const url = await uploadToBlob(buffer, filename);

    return NextResponse.json({
      url,
      filename,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

