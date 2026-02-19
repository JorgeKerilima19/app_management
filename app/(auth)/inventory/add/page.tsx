// app/inventory/add/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createInventoryItem } from "../actions";
import Link from "next/link";

export default async function AddInventoryItemPage() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-violet-600">
          Añadir nuevo item
        </h1>
        <Link
          href="/inventory"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a Inventario
        </Link>
      </div>

      <form action={createInventoryItem} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            name="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
            required
            placeholder="ejm. Tomates, Pollo, Cerveza"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad *
            </label>
            <input
              type="number"
              name="quantity" // ✅ Match schema field
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              required
              placeholder="kg, pcs, L, botellas..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alerta de stock bajo (opcional)
            </label>
            <input
              type="number"
              name="lowStockThreshold"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              placeholder="ejm. 10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Te avisará cuando el stock esté por debajo de este valor
            </p>
          </div>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría (opcional)
          </label>
          <input
            type="text"
            name="category"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
            placeholder="ejm. Producido local, Bebida, Ingredientes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nota (opcional)
          </label>
          <textarea
            name="notes"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
            rows={2}
            placeholder="ejm. Proveedor local, Orgánico, etc."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/inventory"
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
