import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { loadImageBuffer, saveBuffer, getImageMetadata } from "@/lib/image-processor";
import { generatePuzzle } from "@/lib/puzzle-generator";
import { deductCredits } from "@/lib/db/users";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, pieces = 12, showNumbers = true, feature } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Deduct credits
    const creditCost = 5; // Jigsaw puzzle costs 5 credits
    const creditDeducted = await deductCredits(user.id, creditCost, "jigsawPuzzle", "Applied jigsaw puzzle generation");
    
    if (!creditDeducted) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    const buffer = await loadImageBuffer(imageUrl);
    const processedBuffer = await generatePuzzle(buffer, pieces, 5, showNumbers);
    const metadata = await getImageMetadata(processedBuffer);

    const timestamp = Date.now();
    const filename = `${timestamp}-puzzle.png`;
    const url = await saveBuffer(processedBuffer, filename);

    // Get remaining credits
    const { getUserCredits } = await import("@/lib/db/users");
    const creditsRemaining = await getUserCredits(user.id);

    return NextResponse.json({
      url,
      filename,
      width: metadata.width,
      height: metadata.height,
      pieces,
      showNumbers,
      creditsRemaining,
    });
  } catch (error) {
    console.error("Puzzle generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate puzzle" },
      { status: 500 }
    );
  }
}

