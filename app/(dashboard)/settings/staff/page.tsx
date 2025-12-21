// app/(dashboard)/settings/staff/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { StaffList, AddStaffForm } from './_components';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function StaffSettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== 'OWNER' && currentUser.role !== 'MANAGER')) {
    redirect('/dashboard');
  }

  const staff = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-500">Staff Management</h1>
        <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Settings
        </Link>
      </div>

      <AddStaffForm />

      <section>
        <h2 className="text-xl font-semibold mb-4">Current Staff</h2>
        <StaffList staff={staff} />
      </section>
    </div>
  );
}