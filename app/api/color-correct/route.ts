import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  loadImageBuffer,
  colorCorrect,
  saveBuffer,
  getImageMetadata,
} from "@/lib/image-processor";
import { deductCredits } from "@/lib/db/users";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, brightness = 1, contrast = 1, saturation = 1, feature } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Deduct credits
    const creditCost = 1; // Color correction costs 1 credit
    const creditDeducted = await deductCredits(user.id, creditCost, "colorCorrection", "Applied color correction");
    
    if (!creditDeducted) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    const buffer = await loadImageBuffer(imageUrl);
    const processedBuffer = await colorCorrect(buffer, brightness, contrast, saturation);
    const metadata = await getImageMetadata(processedBuffer);

    const timestamp = Date.now();
    const filename = `${timestamp}-color-corrected.png`;
    const url = await saveBuffer(processedBuffer, filename, user.id);

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
    console.error("Color correction error:", error);
    return NextResponse.json(
      { error: "Failed to correct colors" },
      { status: 500 }
    );
  }
}

