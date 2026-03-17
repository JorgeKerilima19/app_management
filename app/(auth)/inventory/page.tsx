/// app/inventory/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import InventoryTable from "./InventoryTable";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    redirect("/login");
  }

  const items = await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
  });

  const categories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean)),
  ).sort() as string[];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-600">Inventario</h1>
        <div className="flex gap-2">
          <Link
            href="/storage"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Almacén →
          </Link>
          <Link
            href="/inventory/add"
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Añadir Item
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500">Sin items en el inventario</p>
          <Link
            href="/inventory/add"
            className="text-violet-600 hover:text-violet-800 mt-2 inline-block"
          >
            Añade tu primer producto →
          </Link>
        </div>
      ) : (
        <InventoryTable items={items} categories={categories} />
      )}
    </div>
  );
}
