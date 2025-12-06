"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function WaiterNavbar() {
  const path = usePathname();

  const links = [
    { name: "Tables", href: "/tables" },
    { name: "Menu", href: "/menu" },
    { name: "Orders", href: "/orders" },
  ];

  return (
    <>
      {/* Desktop left navbar */}
      <aside className="hidden md:block w-52 bg-white border-r p-4">
        <h2 className="text-lg font-semibold mb-6">Waiter</h2>

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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t flex justify-around p-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`p-2 ${
              path === l.href ? "text-black font-semibold" : "text-gray-600"
            }`}
          >
            {l.name}
          </Link>
        ))}
      </nav>
    </>
  );
}
