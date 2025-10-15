import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql, or, ilike } from "drizzle-orm";

// Get all users with pagination and search
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let query = db.select().from(users);

    if (search) {
      query = query.where(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )
      );
    }

    const allUsers = await query.limit(limit).offset(offset).orderBy(sql`${users.createdAt} DESC`);

    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      users: allUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: error.message === "Unauthorized: Admin access required" ? 403 : 500 }
    );
  }
}

