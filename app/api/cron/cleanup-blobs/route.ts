import { NextRequest, NextResponse } from "next/server";
import { deleteExpiredBlobs } from "@/lib/db/blobs";

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting blob cleanup...");
    const deletedCount = await deleteExpiredBlobs();
    
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} expired blobs`,
    });
  } catch (error) {
    console.error("[Cron] Blob cleanup error:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}

