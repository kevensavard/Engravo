import { currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export async function isAdmin(): Promise<boolean> {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return false;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, clerkUser.id),
    });

    return user?.isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function requireAdmin() {
  const admin = await isAdmin();
  
  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }
  
  return true;
}

