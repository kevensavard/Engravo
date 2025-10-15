import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { markBlobAsExported } from "@/lib/db/blobs";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    // Mark the blob as exported (extends retention to 48 hours)
    await markBlobAsExported(imageUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark exported error:", error);
    return NextResponse.json(
      { error: "Failed to mark as exported" },
      { status: 500 }
    );
  }
}

