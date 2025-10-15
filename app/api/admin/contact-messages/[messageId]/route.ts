import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Update message status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    await requireAdmin();

    const { messageId } = await params;
    const { status } = await request.json();

    await db
      .update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, messageId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update message error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update message" },
      { status: error.message === "Unauthorized: Admin access required" ? 403 : 500 }
    );
  }
}

// Delete message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    await requireAdmin();

    const { messageId } = await params;

    await db.delete(contactMessages).where(eq(contactMessages.id, messageId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete message" },
      { status: error.message === "Unauthorized: Admin access required" ? 403 : 500 }
    );
  }
}

