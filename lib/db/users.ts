import { db } from "./index";
import { users, creditTransactions } from "./schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// Get or create user
export async function getOrCreateUser(clerkUserId: string, email: string, firstName?: string, lastName?: string, imageUrl?: string) {
  // First check by Clerk user ID
  let existingUser = await db.query.users.findFirst({
    where: eq(users.id, clerkUserId),
  });

  if (existingUser) {
    return existingUser;
  }

  // Check if user exists with this email (might be from different auth method)
  existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    // User exists with same email but different Clerk ID
    // Try to update the user's Clerk ID, but handle errors gracefully
    try {
      await db.update(users)
        .set({
          id: clerkUserId,
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
          imageUrl: imageUrl || existingUser.imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.email, email));
      
      // Return the updated user
      return await db.query.users.findFirst({
        where: eq(users.id, clerkUserId),
      });
    } catch (error) {
      // If update fails (e.g., due to primary key constraints), 
      // just return the existing user without updating
      console.warn("Failed to update user Clerk ID, returning existing user:", error);
      return existingUser;
    }
  }

  // Create new user with free tier credits
  const [newUser] = await db.insert(users).values({
    id: clerkUserId,
    email,
    firstName: firstName || null,
    lastName: lastName || null,
    imageUrl: imageUrl || null,
    credits: 60, // Free tier
    subscriptionTier: "free",
  }).returning();

  // Create initial credit transaction
  await db.insert(creditTransactions).values({
    id: nanoid(),
    userId: clerkUserId,
    amount: 60,
    type: "subscription",
    description: "Welcome bonus - Free tier credits",
  });

  return newUser;
}

// Get user credits
export async function getUserCredits(userId: string): Promise<number> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user?.credits || 0;
}

// Deduct credits
export async function deductCredits(
  userId: string,
  amount: number,
  featureName: string,
  description?: string
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || user.credits < amount) {
    return false; // Not enough credits
  }

  // Deduct credits
  await db.update(users)
    .set({
      credits: user.credits - amount,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Record transaction
  await db.insert(creditTransactions).values({
    id: nanoid(),
    userId,
    amount: -amount,
    type: "feature_use",
    description: description || `Used ${featureName}`,
    featureName,
  });

  return true;
}

// Add credits
export async function addCredits(
  userId: string,
  amount: number,
  type: "purchase" | "subscription" | "refund",
  description: string
): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Add credits
  await db.update(users)
    .set({
      credits: user.credits + amount,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Record transaction
  await db.insert(creditTransactions).values({
    id: nanoid(),
    userId,
    amount,
    type,
    description,
  });
}

// Update subscription
export async function updateSubscription(
  userId: string,
  tier: string,
  status: string,
  endsAt?: Date
): Promise<void> {
  await db.update(users)
    .set({
      subscriptionTier: tier,
      subscriptionStatus: status,
      subscriptionEndsAt: endsAt || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

// Get user profile
export async function getUserProfile(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found.`);
  }

  return user;
}

