"use client";

import Link from "next/link";
import { useAuth } from "@/app/providers";

export default function Sidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const menu: Record<string, { label: string; href: string }[]> = {
    admin: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Tables", href: "/tables" },
      { label: "Menu", href: "/menu" },
      { label: "Kitchen", href: "/kitchen" },
    ],
    cashier: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Tables", href: "/tables" },
      { label: "Menu", href: "/menu" },
    ],
    cook: [
      { label: "Kitchen", href: "/kitchen" },
      { label: "Tables", href: "/tables" },
    ],
    waiter: [
      { label: "Tables", href: "/tables" },
      { label: "Menu", href: "/menu" },
      { label: "Orders", href: "/orders" },
    ],
  };

  return (
    <aside className="h-screen w-64 bg-[#F8F7FF] border-r p-5 fixed">
      <h2 className="font-bold text-xl mb-6">App</h2>

      <nav className="space-y-3">
        {menu[user.role].map((item) => (
          <Link href={item.href} key={item.href} className="block text-lg">
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={logout}
        className="mt-10 text-red-500"
      >
        Logout
      </button>
    </aside>
  );
}
