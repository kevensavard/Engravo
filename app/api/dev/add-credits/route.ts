import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/db/users";
import { db } from "@/lib/db/index";
import { users, creditTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// Development helper - add credits for testing
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { amount = 1000 } = await request.json();

    console.log(`Development: Adding ${amount} credits for user ${user.id}`);

    // Ensure user exists in database first
    console.log("Development: Creating/updating user in database...");
    const dbUser = await getOrCreateUser(user.id, user.emailAddresses[0]?.emailAddress || "", user.firstName || "", user.lastName || "", user.imageUrl);
    console.log("Development: User created/found in database:", dbUser.id);

    // Add credits directly using the user we just created/found
    console.log("Development: Adding credits...");
    const updatedUser = await db.update(users)
      .set({
        credits: dbUser.credits + amount,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    // Record transaction
    await db.insert(creditTransactions).values({
      id: nanoid(),
      userId: user.id,
      amount,
      type: "subscription",
      description: `Development testing credits - ${amount} added`,
    });

    console.log("Development: Credits added successfully, new total:", updatedUser[0]?.credits);

    return NextResponse.json({
      message: `Added ${amount} credits for testing`,
      userId: user.id,
      creditsAdded: amount,
      newTotal: updatedUser[0]?.credits || dbUser.credits + amount,
      userCreated: !!dbUser
    });

  } catch (error) {
    console.error("Add credits error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to add credits: ${errorMessage}` },
      { status: 500 }
    );
  }
}
