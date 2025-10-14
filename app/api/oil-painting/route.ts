import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  loadImageBuffer,
  oilPainting,
  saveBuffer,
  getImageMetadata,
} from "@/lib/image-processor";
import { deductCredits } from "@/lib/db/users";

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
    const creditCost = 2; // Oil painting costs 2 credits
    const creditDeducted = await deductCredits(user.id, creditCost, "oilPainting", "Applied oil painting effect");
    
    if (!creditDeducted) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    const buffer = await loadImageBuffer(imageUrl);
    const processedBuffer = await oilPainting(buffer);
    const metadata = await getImageMetadata(processedBuffer);

    const timestamp = Date.now();
    const filename = `${timestamp}-oil-painting.png`;
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
    console.error("Oil painting error:", error);
    return NextResponse.json(
      { error: "Failed to apply oil painting effect" },
      { status: 500 }
    );
  }
}

