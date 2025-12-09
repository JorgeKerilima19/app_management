// src/app/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth';
import cookie from 'cookie';

export default async function HomePage() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('token')?.value || '';
  const fakeCookieHeader = token ? `token=${token}` : '';
  const user = requireAuth({ headers: { get: () => fakeCookieHeader } } as any);

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}