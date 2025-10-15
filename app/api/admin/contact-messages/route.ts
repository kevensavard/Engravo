import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// Get all contact messages
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    let query = db.select().from(contactMessages);

    if (status !== "all") {
      query = query.where(eq(contactMessages.status, status));
    }

    const messages = await query.orderBy(sql`${contactMessages.createdAt} DESC`).limit(100);

    // Get counts by status
    const unreadCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contactMessages)
      .where(eq(contactMessages.status, "unread"));

    return NextResponse.json({
      messages,
      unreadCount: unreadCount[0]?.count || 0,
    });
  } catch (error: any) {
    console.error("Admin contact messages error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: error.message === "Unauthorized: Admin access required" ? 403 : 500 }
    );
  }
}

