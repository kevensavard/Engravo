import { db } from "./index";
import { userBlobs } from "./schema";
import { eq, and, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { deleteFromBlob, deleteMultipleFromBlob } from "../storage";

// Track a new blob (simplified - no expiry needed, delete on new upload)
export async function trackBlob(userId: string, blobUrl: string) {
  await db.insert(userBlobs).values({
    id: nanoid(),
    userId,
    blobUrl,
    isExported: false,
    expiresAt: null,
  });
}

// Delete ALL blobs for a user (called on new upload)
export async function deleteUserSessionBlobs(userId: string) {
  try {
    // Get all blobs for this user
    const blobs = await db.query.userBlobs.findMany({
      where: eq(userBlobs.userId, userId),
    });

    if (blobs.length === 0) {
      return;
    }

    const urls = blobs.map(b => b.blobUrl);
    
    // Delete from Vercel Blob
    await deleteMultipleFromBlob(urls);
    
    // Delete from database
    await db.delete(userBlobs)
      .where(eq(userBlobs.userId, userId));

    console.log(`Cleaned up ${urls.length} blobs for user ${userId}`);
  } catch (error) {
    console.error("Error deleting user blobs:", error);
  }
}

// Get user's blob URLs
export async function getUserBlobs(userId: string) {
  return await db.query.userBlobs.findMany({
    where: eq(userBlobs.userId, userId),
  });
}


