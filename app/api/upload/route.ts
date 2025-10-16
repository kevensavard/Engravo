import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getImageMetadata } from "@/lib/image-processor";
import { uploadToBlob } from "@/lib/storage";
import { trackBlob, deleteUserSessionBlobs } from "@/lib/db/blobs";

export async function POST(request: NextRequest) {
  try {
    console.log("Upload request received");
    
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("File received:", file.name, file.size, file.type);

    // Get current user
    const user = await currentUser();
    if (!user) {
      console.log("No user authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("User authenticated:", user.id);

    // Delete all previous blobs for this user (cleanup old images)
    console.log("Cleaning up previous blobs...");
    await deleteUserSessionBlobs(user.id);

    // Convert file to buffer
    console.log("Converting file to buffer...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("Buffer created, size:", buffer.length);

    // Get metadata
    console.log("Getting image metadata...");
    const metadata = await getImageMetadata(buffer);
    console.log("Metadata:", metadata);

    // Generate unique filename with user ID
    const timestamp = Date.now();
    const filename = `uploads/${user.id}/${timestamp}-${file.name}`;
    console.log("Generated filename:", filename);

    // Upload to Vercel Blob or local storage
    console.log("Uploading to storage...");
    const url = await uploadToBlob(buffer, filename);
    console.log("Upload successful, URL:", url);

    // Track the blob for cleanup
    console.log("Tracking blob...");
    await trackBlob(user.id, url);

    const response = {
      url,
      filename,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    };
    console.log("Returning response:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to upload image: ${errorMessage}` },
      { status: 500 }
    );
  }
}

