import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, creditTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();

    const { userId } = await params;
    const body = await request.json();
    const { credits, subscriptionTier, subscriptionStatus, isAdmin } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Track if we're adding credits
    let creditsAdded = 0;

    if (credits !== undefined) {
      // Get current user to calculate difference
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (currentUser) {
        creditsAdded = credits - currentUser.credits;
        updateData.credits = credits;

        // Record credit transaction if changed
        if (creditsAdded !== 0) {
          await db.insert(creditTransactions).values({
            id: nanoid(),
            userId,
            amount: creditsAdded,
            type: creditsAdded > 0 ? "purchase" : "feature_use",
            description: `Admin adjustment: ${creditsAdded > 0 ? "+" : ""}${creditsAdded} credits`,
          });
        }
      }
    }

    if (subscriptionTier !== undefined) {
      updateData.subscriptionTier = subscriptionTier;
    }

    if (subscriptionStatus !== undefined) {
      updateData.subscriptionStatus = subscriptionStatus;
    }

    if (isAdmin !== undefined) {
      updateData.isAdmin = isAdmin;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json({
      success: true,
      user: updatedUser,
      creditsAdded,
    });
  } catch (error: any) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: error.message === "Unauthorized: Admin access required" ? 403 : 500 }
    );
  }
}

// Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();

    const { userId } = await params;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's transactions
    const transactions = await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, userId),
      limit: 50,
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });

    return NextResponse.json({
      user,
      transactions,
    });
  } catch (error: any) {
    console.error("Admin user fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
      { status: error.message === "Unauthorized: Admin access required" ? 403 : 500 }
    );
  }
}

// Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();

    const { userId } = await params;

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("Admin user delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: error.message === "Unauthorized: Admin access required" ? 403 : 500 }
    );
  }
}

