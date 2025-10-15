import { db } from "./index";
import { userBlobs } from "./schema";
import { eq, and, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { deleteFromBlob, deleteMultipleFromBlob } from "../storage";

// Track a new blob
export async function trackBlob(userId: string, blobUrl: string, isExported: boolean = false) {
  const expiresAt = isExported 
    ? new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
    : new Date(Date.now() + 60 * 1000); // 1 minute from now (will be cleaned up quickly if not used)

  await db.insert(userBlobs).values({
    id: nanoid(),
    userId,
    blobUrl,
    isExported,
    expiresAt,
  });
}

// Mark blob as exported (extends expiry to 48 hours)
export async function markBlobAsExported(blobUrl: string) {
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  
  await db.update(userBlobs)
    .set({
      isExported: true,
      expiresAt,
    })
    .where(eq(userBlobs.blobUrl, blobUrl));
}

// Delete all non-exported blobs for a user (called on new upload)
export async function deleteUserSessionBlobs(userId: string) {
  try {
    // Get all non-exported blobs for this user
    const blobs = await db.query.userBlobs.findMany({
      where: and(
        eq(userBlobs.userId, userId),
        eq(userBlobs.isExported, false)
      ),
    });

    if (blobs.length === 0) {
      return;
    }

    const urls = blobs.map(b => b.blobUrl);
    
    // Delete from Vercel Blob
    await deleteMultipleFromBlob(urls);
    
    // Delete from database
    await db.delete(userBlobs)
      .where(and(
        eq(userBlobs.userId, userId),
        eq(userBlobs.isExported, false)
      ));

    console.log(`Cleaned up ${urls.length} session blobs for user ${userId}`);
  } catch (error) {
    console.error("Error deleting user session blobs:", error);
  }
}

// Delete expired blobs (run via cron)
export async function deleteExpiredBlobs() {
  try {
    const now = new Date();
    
    // Get all expired blobs
    const expiredBlobs = await db.query.userBlobs.findMany({
      where: lte(userBlobs.expiresAt, now),
    });

    if (expiredBlobs.length === 0) {
      console.log("No expired blobs to clean up");
      return 0;
    }

    const urls = expiredBlobs.map(b => b.blobUrl);
    
    // Delete from Vercel Blob
    await deleteMultipleFromBlob(urls);
    
    // Delete from database
    await db.delete(userBlobs)
      .where(lte(userBlobs.expiresAt, now));

    console.log(`Cleaned up ${urls.length} expired blobs`);
    return urls.length;
  } catch (error) {
    console.error("Error deleting expired blobs:", error);
    return 0;
  }
}

// Get user's blob URLs
export async function getUserBlobs(userId: string) {
  return await db.query.userBlobs.findMany({
    where: eq(userBlobs.userId, userId),
  });
}

