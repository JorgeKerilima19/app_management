// components/Sidebar.tsx
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import {
  Dashboard,
  Table,
  Cashier,
  Inventory,
  Kitchen,
  Settings,
} from "@/components/svg";

export default async function Sidebar() {
  const user = await getCurrentUser();
  if (!user) return null;

  const navItems = [
    { label: "Panel", href: "/dashboard", icon: <Dashboard /> },
    { label: "Mesas", href: "/tables", icon: <Table /> },
    { label: "Cocina", href: "/kitchen", icon: <Kitchen /> },
    { label: "Caja", href: "/billing", icon: <Cashier /> },
    { label: "Inventario", href: "/inventory", icon: <Inventory /> },
    { label: "Ajustes", href: "/settings", icon: <Settings /> },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <span className="text-2xl">🍽️</span>
          <span className="text-xl font-bold text-violet-400">Taguchi Restaurant</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-violet-700 transition"
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700 mt-auto">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-violet-500 flex items-center justify-center">
            <span className="font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
