import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  loadImageBuffer,
  cropImage,
  saveBuffer,
  getImageMetadata,
} from "@/lib/image-processor";
import { deductCredits } from "@/lib/db/users";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, x, y, width, height, feature } = await request.json();

    if (!imageUrl || x === undefined || y === undefined || !width || !height) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Deduct credits
    const creditCost = 1; // Interactive crop costs 1 credit
    const creditDeducted = await deductCredits(user.id, creditCost, "interactiveCrop", "Applied interactive crop");
    
    if (!creditDeducted) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    const buffer = await loadImageBuffer(imageUrl);
    const processedBuffer = await cropImage(buffer, x, y, width, height);
    const metadata = await getImageMetadata(processedBuffer);

    const timestamp = Date.now();
    const filename = `${timestamp}-cropped.png`;
    const url = await saveBuffer(processedBuffer, filename);

    // Get remaining credits
    const { getUserCredits } = await import("@/lib/db/users");
    const creditsRemaining = await getUserCredits(user.id);

    return NextResponse.json({
      url,
      filename,
      width: metadata.width,
      height: metadata.height,
      creditsRemaining,
    });
  } catch (error) {
    console.error("Crop error:", error);
    return NextResponse.json(
      { error: "Failed to crop image" },
      { status: 500 }
    );
  }
}

