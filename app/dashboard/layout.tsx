// app/dashboard/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyToken } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get('auth_token')?.value;
  const user = token ? verifyToken(token) : null;

  if (!user) {
    redirect('/login');
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Tables', href: '/dashboard/tables' },
    { name: 'Orders', href: '/dashboard/orders' },
    { name: 'Bills', href: '/dashboard/bills' },
    { name: 'Inventory', href: '/dashboard/inventory' },
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-violet-600">Restaurant Mgr</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Dashboard</h2>
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-medium text-violet-600">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 bg-gray-50 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}