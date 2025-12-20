// app/page.tsx (debug version)
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const cookieStore = cookies();
  console.log('Session cookie:', (await cookieStore).get('user_id')?.value);
  
  const user = await getCurrentUser();
  console.log('User:', user);

  if (!user) redirect('/login');
  redirect('/dashboard');
}