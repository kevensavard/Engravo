import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getUserProfile } from "@/lib/db/users";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const profile = await getUserProfile(user.id);

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      imageUrl: profile.imageUrl,
      credits: profile.credits,
      subscriptionTier: profile.subscriptionTier,
      subscriptionStatus: profile.subscriptionStatus,
      subscriptionEndsAt: profile.subscriptionEndsAt,
      createdAt: profile.createdAt,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
