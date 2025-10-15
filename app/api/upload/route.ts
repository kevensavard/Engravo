import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getImageMetadata } from "@/lib/image-processor";
import { uploadToBlob } from "@/lib/storage";
import { trackBlob, deleteUserSessionBlobs } from "@/lib/db/blobs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Delete all previous blobs for this user (cleanup old images)
    await deleteUserSessionBlobs(user.id);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get metadata
    const metadata = await getImageMetadata(buffer);

    // Generate unique filename with user ID
    const timestamp = Date.now();
    const filename = `uploads/${user.id}/${timestamp}-${file.name}`;

    // Upload to Vercel Blob
    const url = await uploadToBlob(buffer, filename);

    // Track the blob for cleanup
    await trackBlob(user.id, url);

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

