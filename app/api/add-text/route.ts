import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  loadImageBuffer,
  addTextToImage,
  saveBuffer,
  getImageMetadata,
} from "@/lib/image-processor";
import { deductCredits } from "@/lib/db/users";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, text, x, y, fontSize, color, feature } = await request.json();

    if (!imageUrl || !text || x === undefined || y === undefined) {
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
    const creditCost = 1; // Add text costs 1 credit
    const creditDeducted = await deductCredits(user.id, creditCost, "addText", "Applied add text effect");
    
    if (!creditDeducted) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    const buffer = await loadImageBuffer(imageUrl);
    const processedBuffer = await addTextToImage(
      buffer,
      text,
      x,
      y,
      fontSize || 48,
      color || "#000000"
    );
    const metadata = await getImageMetadata(processedBuffer);

    const timestamp = Date.now();
    const filename = `${timestamp}-with-text.png`;
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
    console.error("Add text error:", error);
    return NextResponse.json(
      { error: "Failed to add text" },
      { status: 500 }
    );
  }
}

