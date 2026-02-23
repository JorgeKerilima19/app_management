import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { updateStorageItem } from "../actions";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStorageItemPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const item = await prisma.storageItem.findUnique({ where: { id } });

  if (!item) {
    redirect("/storage");
  }

  const inventoryItems = await prisma.inventoryItem.findMany({
    select: { id: true, name: true, unit: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-violet-600">
          Editar Item del Almacén
        </h1>
        <Link
          href="/storage"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a Almacén
        </Link>
      </div>

      <form action={updateStorageItem} className="space-y-4">
        <input type="hidden" name="id" value={item.id} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            name="name"
            list="inventory-names"
            defaultValue={item.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
            required
          />
          <datalist id="inventory-names">
            {inventoryItems.map((inv) => (
              <option key={inv.id} value={inv.name} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad *
            </label>
            <input
              type="number"
              name="currentQuantity"
              step="0.01"
              min="0"
              defaultValue={item.currentQuantity}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidad *
            </label>
            <input
              type="text"
              name="unit"
              list="inventory-units"
              defaultValue={item.unit}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              required
            />
            <datalist id="inventory-units">
              {inventoryItems.map((inv) => (
                <option key={inv.id} value={inv.unit} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo por unidad (opcional)
            </label>
            <input
              type="number"
              name="costPerUnit"
              step="0.01"
              min="0"
              defaultValue={item.costPerUnit?.toString() ?? ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              placeholder="ejm. 2.50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría (opcional)
            </label>
            <input
              type="text"
              name="category"
              defaultValue={item.category || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              placeholder="ejm. Vegetales, Bebidas"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nota (opcional)
          </label>
          <textarea
            name="notes"
            defaultValue={item.notes || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
            rows={2}
            placeholder="ejm. Proveedor local, Orgánico"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/storage"
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
