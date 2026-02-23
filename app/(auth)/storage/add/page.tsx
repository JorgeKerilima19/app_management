import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { createStorageItem } from "../actions";
import Link from "next/link";

export default async function AddStorageItemPage() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  const inventoryItems = await prisma.inventoryItem.findMany({
    select: { id: true, name: true, unit: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-violet-600">
          Añadir nuevo item al Almacén
        </h1>
        <Link
          href="/storage"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a Almacén
        </Link>
      </div>

      <form action={createStorageItem} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            name="name"
            list="inventory-names"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
            required
            placeholder="ejm. Tomates, Pollo, Cerveza"
          />
          <datalist id="inventory-names">
            {inventoryItems.map((item) => (
              <option key={item.id} value={item.name} />
            ))}
          </datalist>
          <p className="text-xs text-gray-500 mt-1">
            Usa el mismo nombre que en Inventario para vincular automáticamente
          </p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              required
              placeholder="0.00"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              required
              placeholder="kg, pcs, L, botellas..."
            />
            <datalist id="inventory-units">
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.unit} />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              placeholder="ejm. Vegetales, Bebidas, Limpieza"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nota (opcional)
          </label>
          <textarea
            name="notes"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
            rows={2}
            placeholder="ejm. Proveedor: Mercado Central, Lote #123"
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
            Añadir Item
          </button>
        </div>
      </form>
    </div>
  );
}
