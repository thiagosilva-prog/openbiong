'use server';

import { auth } from '@/lib/auth';
import { api } from '@/trpc/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const claimLink = async (link: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return redirect('/app/sign-in');
  }

  const slug = link.toLowerCase();

  try {
    await api.profileLink.create({ link: slug });
  } catch {
    return redirect('/claim-link');
  }

  redirect(`/${slug}?edit=1`);
};
