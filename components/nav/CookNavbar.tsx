"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CookNavbar() {
  const path = usePathname();

  const links = [
    { name: "Recipes", href: "/menu" },
    { name: "Kitchen", href: "/kitchen" },
  ];

  return (
    <aside className="w-56 bg-white border-r p-4">
      <h2 className="text-lg font-semibold mb-6">Kitchen</h2>

      <nav className="flex flex-col gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`p-2 rounded-md ${
              path === l.href ? "bg-black text-white" : "hover:bg-gray-100"
            }`}
          >
            {l.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
