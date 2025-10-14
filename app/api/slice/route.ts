import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  loadImageBuffer,
  sliceImage,
  saveBuffer,
} from "@/lib/image-processor";
import { deductCredits } from "@/lib/db/users";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, rows, cols, feature } = await request.json();

    if (!imageUrl || !rows || !cols) {
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
    const creditCost = 3; // Slice images costs 3 credits
    const creditDeducted = await deductCredits(user.id, creditCost, "sliceImages", "Applied slice images effect");
    
    if (!creditDeducted) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    const buffer = await loadImageBuffer(imageUrl);
    const slices = await sliceImage(buffer, rows, cols);

    const timestamp = Date.now();
    const urls: string[] = [];

    for (let i = 0; i < slices.length; i++) {
      const filename = `${timestamp}-slice-${i + 1}.png`;
      const url = await saveBuffer(slices[i], filename);
      urls.push(url);
    }

    // Get remaining credits
    const { getUserCredits } = await import("@/lib/db/users");
    const creditsRemaining = await getUserCredits(user.id);

    // For now, return the first slice as the main result
    // In a real app, you'd return all slices or zip them
    return NextResponse.json({
      url: urls[0],
      filename: `${timestamp}-slice-1.png`,
      slices: urls,
      count: slices.length,
      creditsRemaining,
    });
  } catch (error) {
    console.error("Slice error:", error);
    return NextResponse.json(
      { error: "Failed to slice image" },
      { status: 500 }
    );
  }
}

