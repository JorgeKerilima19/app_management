// components/Navbar.tsx
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const user = await getCurrentUser();
  if (!user) return null;

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tables", href: "/tables" },
    { label: "Kitchen", href: "/kitchen" },
    { label: "Billing", href: "/billing" },
    { label: "Inventory", href: "/inventory" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-violet-600 hover:text-violet-800"
            >
              🍽️ Restaurant App
            </Link>
          </div>

          {/* Nav + User */}
          <div className="flex items-center space-x-6">
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-violet-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-violet-500 flex items-center justify-center">
                <span className="text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
