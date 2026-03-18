/// app/storage/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import StorageTable from "./StorageTable";
import SyncCategoriesButton from "./SyncCategoriesButton";

function serializeStorageItem(item: any) {
  return {
    ...item,
    currentQuantity:
      typeof item.currentQuantity === "object"
        ? parseFloat(item.currentQuantity.toString())
        : item.currentQuantity,
    costPerUnit: item.costPerUnit
      ? typeof item.costPerUnit === "object"
        ? parseFloat(item.costPerUnit.toString())
        : item.costPerUnit
      : null,
  };
}

export default async function StoragePage() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  const items = await prisma.storageItem.findMany({
    orderBy: { name: "asc" },
  });

  const serializedItems = items.map(serializeStorageItem);

  const categories = Array.from(
    new Set(serializedItems.map((item) => item.category).filter(Boolean)),
  ).sort() as string[];

  const inventoryItems = await prisma.inventoryItem.findMany({
    select: { id: true, name: true, unit: true, category: true },
    orderBy: { name: "asc" },
  });

  // Count items that could be synced
  const storageWithCategory = serializedItems.filter(
    (item) => item.category,
  ).length;
  const inventoryWithoutCategory = inventoryItems.filter(
    (item) => !item.category,
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-600">Almacén General</h1>
        <div className="flex gap-2">
          <SyncCategoriesButton
            storageWithCategory={storageWithCategory}
            inventoryWithoutCategory={inventoryWithoutCategory}
          />
          <Link
            href="/inventory"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            ← Inventario
          </Link>
          <Link
            href="/storage/add"
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Añadir Item
          </Link>
        </div>
      </div>

      {/* Info Message */}
      {inventoryWithoutCategory > 0 && storageWithCategory > 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800">
            <strong>
              ℹ️ {inventoryWithoutCategory} items en inventario sin categoría.
            </strong>{" "}
            El botón "Sincronizar" copiará las categorías desde Almacén hacia
            Inventario.
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800">
            ✅ Todas las categorías están sincronizadas.
          </p>
        </div>
      )}

      {serializedItems.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500">Sin items en el almacén</p>
          <Link
            href="/storage/add"
            className="text-violet-600 hover:text-violet-800 mt-2 inline-block"
          >
            Añade tu primer producto →
          </Link>
        </div>
      ) : (
        <StorageTable
          items={serializedItems}
          categories={categories}
          inventoryItems={inventoryItems}
        />
      )}
    </div>
  );
}
