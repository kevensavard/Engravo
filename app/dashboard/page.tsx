import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ModernImageEditor from "@/components/ModernImageEditor";
import { getOrCreateUser } from "@/lib/db/users";

export default async function Dashboard() {
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

  return <ModernImageEditor />;
}

