import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, creditTransactions } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    await requireAdmin();

    // Get total users
    const totalUsersResult = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Get users by subscription tier
    const tierCounts = await db
      .select({
        tier: users.subscriptionTier,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.subscriptionTier);

    // Get total credits distributed
    const totalCreditsResult = await db
      .select({ total: sql<number>`sum(credits)::int` })
      .from(users);
    const totalCredits = totalCreditsResult[0]?.total || 0;

    // Get feature usage stats
    const featureUsage = await db
      .select({
        feature: creditTransactions.featureName,
        count: sql<number>`count(*)::int`,
        totalCredits: sql<number>`sum(abs(amount))::int`,
      })
      .from(creditTransactions)
      .where(eq(creditTransactions.type, "feature_use"))
      .groupBy(creditTransactions.featureName);

    // Get MRR (Monthly Recurring Revenue)
    // Calculate based on active subscriptions
    const subscriptionRevenue = tierCounts.reduce((total, tier) => {
      const revenue: { [key: string]: number } = {
        starter: 9.99,
        pro: 24.99,
        master: 49.99,
      };
      return total + (revenue[tier.tier || ""] || 0) * (tier.count || 0);
    }, 0);

    // Get new users this month
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo));
    const newUsersThisMonth = newUsersResult[0]?.count || 0;

    // Get total transactions this month
    const transactionsThisMonthResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creditTransactions)
      .where(gte(creditTransactions.createdAt, thirtyDaysAgo));
    const transactionsThisMonth = transactionsThisMonthResult[0]?.count || 0;

    // Get credit purchases vs usage
    const creditAdditionsResult = await db
      .select({ total: sql<number>`sum(amount)::int` })
      .from(creditTransactions)
      .where(sql`${creditTransactions.amount} > 0`);
    const totalCreditsAdded = creditAdditionsResult[0]?.total || 0;

    const creditUsageResult = await db
      .select({ total: sql<number>`sum(abs(amount))::int` })
      .from(creditTransactions)
      .where(sql`${creditTransactions.amount} < 0`);
    const totalCreditsUsed = creditUsageResult[0]?.total || 0;

    // Get recent activity (last 10 transactions)
    const recentActivity = await db
      .select({
        id: creditTransactions.id,
        userId: creditTransactions.userId,
        amount: creditTransactions.amount,
        type: creditTransactions.type,
        description: creditTransactions.description,
        featureName: creditTransactions.featureName,
        createdAt: creditTransactions.createdAt,
      })
      .from(creditTransactions)
      .orderBy(sql`${creditTransactions.createdAt} DESC`)
      .limit(10);

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsersThisMonth,
        totalCredits,
        mrr: subscriptionRevenue.toFixed(2),
        transactionsThisMonth,
      },
      subscriptions: {
        byTier: tierCounts,
        mrr: subscriptionRevenue.toFixed(2),
      },
      credits: {
        totalDistributed: totalCredits,
        totalAdded: totalCreditsAdded,
        totalUsed: totalCreditsUsed,
        remaining: totalCredits,
      },
      features: {
        usage: featureUsage,
      },
      recentActivity,
    });
  } catch (error: any) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: error.message === "Unauthorized: Admin access required" ? 403 : 500 }
    );
  }
}

