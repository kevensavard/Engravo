import { db } from "./index";
import { userBlobs } from "./schema";
import { eq, and, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { deleteFromBlob, deleteMultipleFromBlob } from "../storage";

// Track a new blob (simplified - no expiry needed, delete on new upload)
export async function trackBlob(userId: string, blobUrl: string) {
  try {
    await db.insert(userBlobs).values({
      id: nanoid(),
      userId,
      blobUrl,
      isExported: false,
      expiresAt: null,
    });
  } catch (error) {
    console.warn("Failed to track blob (table may not exist in local development):", error);
    // Don't throw - this is not critical for functionality
  }
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
    
    // Delete from Vercel Blob or local storage
    await deleteMultipleFromBlob(urls);
    
    // Delete from database
    await db.delete(userBlobs)
      .where(eq(userBlobs.userId, userId));

    console.log(`Cleaned up ${urls.length} blobs for user ${userId}`);
  } catch (error) {
    console.warn("Error deleting user blobs (table may not exist in local development):", error);
    // Don't throw - this is not critical for functionality
  }
}

// Get user's blob URLs
export async function getUserBlobs(userId: string) {
  try {
    return await db.query.userBlobs.findMany({
      where: eq(userBlobs.userId, userId),
    });
  } catch (error) {
    console.warn("Failed to get user blobs (table may not exist in local development):", error);
    return []; // Return empty array if table doesn't exist
  }
}


