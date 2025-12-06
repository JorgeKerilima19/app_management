"use client";

import Link from "next/link";
import { useState } from "react";

export default function Sidebar({ role }: { role: string }) {
  const [open, setOpen] = useState(true);

  const adminCashierLinks = [
    { label: "Overview", href: "/dashboard" },
    { label: "Tables", href: "/tables" },
    { label: "Orders", href: "/orders" },
    { label: "Menu", href: "/menu" },
    { label: "Inventory", href: "/inventory" },
    { label: "Staff", href: "/staff" },
    { label: "Reports", href: "/reports" },
  ];

  const cookLinks = [
    { label: "Kitchen", href: "/dashboard" },
    { label: "Recipes", href: "/recipes" },
  ];

  const waiterLinks = [
    { label: "Tables", href: "/tables" },
    { label: "New Order", href: "/orders/new" },
    { label: "Menu", href: "/menu" },
  ];

  const links =
    role === "admin" || role === "cashier"
      ? adminCashierLinks
      : role === "cook"
      ? cookLinks
      : waiterLinks;

  return (
    <aside
      className={`
        ${open ? "w-64" : "w-20"}
        bg-[#1A1A22] text-white transition-all h-screen p-4 flex flex-col
      `}
    >
      <button
        onClick={() => setOpen(!open)}
        className="mb-6 text-sm opacity-70 hover:opacity-100"
      >
        {open ? "Collapse" : "Expand"}
      </button>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block px-3 py-2 rounded-lg hover:bg-[#2A2A33]"
          >
            {open ? link.label : link.label.charAt(0)}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
