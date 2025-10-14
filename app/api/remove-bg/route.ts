import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import axios from "axios";
import { saveBuffer, getImageMetadata } from "@/lib/image-processor";
import { deductCredits } from "@/lib/db/users";

// Configure Cloudinary
// You'll need to add these to your environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "your_cloud_name",
  api_key: process.env.CLOUDINARY_API_KEY || "your_api_key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "your_api_secret"
});

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
    const creditCost = 3; // Remove background costs 3 credits
    const creditDeducted = await deductCredits(user.id, creditCost, "removeBackground", "Applied background removal");
    
    if (!creditDeducted) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    console.log("Remove background: Processing image:", imageUrl);

    // Step 1: Read local image file (strip query parameters)
    const cleanUrl = imageUrl.split('?')[0];
    const localPath = path.join(process.cwd(), "public", cleanUrl);
    console.log("Remove background: Reading local file:", localPath);
    
    if (!fs.existsSync(localPath)) {
      throw new Error(`Image file not found: ${localPath}`);
    }

    // Step 2: Upload to Cloudinary (regular upload first)
    console.log("Remove background: Uploading to Cloudinary...");
    
    const uploadResult = await cloudinary.uploader.upload(localPath, {
      resource_type: "image"
    });

    console.log("Remove background: Image uploaded, public_id:", uploadResult.public_id);

    // Step 3: Generate transformation URL with background removal
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      effect: "background_removal",
      format: "png"
    });

    console.log("Remove background: Transformation URL:", transformedUrl);

    // Step 4: Download the processed image from Cloudinary
    const imageResponse = await axios.get(transformedUrl, {
      responseType: 'arraybuffer'
    });

    const resultImageBuffer = Buffer.from(imageResponse.data);
    console.log("Remove background: Downloaded image, size:", resultImageBuffer.length);

    // Step 5: Save locally and return
    const metadata = await getImageMetadata(resultImageBuffer);
    const timestamp = Date.now();
    const filename = `${timestamp}-no-bg.png`;
    const url = await saveBuffer(resultImageBuffer, filename);
    
    console.log("Remove background: Saved locally to:", url);

    // Get remaining credits
    const { getUserCredits } = await import("@/lib/db/users");
    const creditsRemaining = await getUserCredits(user.id);

    return NextResponse.json({
      url,
      filename,
      width: metadata.width,
      height: metadata.height,
      cloudinaryUrl: uploadResult.secure_url,
      creditsRemaining,
    });
  } catch (error) {
    console.error("Remove background error:", error);
    return NextResponse.json(
      { error: "Failed to remove background: " + error.message },
      { status: 500 }
    );
  }
}

