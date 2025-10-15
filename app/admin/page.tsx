import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Check if user is admin
  const user = await db.query.users.findFirst({
    where: eq(users.id, clerkUser.id),
  });

  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  return <AdminDashboard />;
}

