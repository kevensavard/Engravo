import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import SubscriptionManagement from "@/components/SubscriptionManagement";
import { getOrCreateUser } from "@/lib/db/users";

export default async function SubscriptionPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Sync user with database
  await getOrCreateUser(
    user.id,
    user.emailAddresses[0]?.emailAddress || '',
    user.firstName || undefined,
    user.lastName || undefined,
    user.imageUrl || undefined
  );

  return <SubscriptionManagement />;
}
