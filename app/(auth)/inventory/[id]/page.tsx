// app/inventory/[id]/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { updateInventoryItem } from "../actions";
import Link from "next/link";

export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
  });

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-xl">
        <p className="text-red-500 text-center py-8">Item no encontrado.</p>
        <div className="text-center">
          <Link
            href="/inventory"
            className="text-violet-600 hover:text-violet-800"
          >
            ← Volver a Inventario
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-violet-600">Editar Item</h1>
        <Link
          href="/inventory"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a Inventario
        </Link>
      </div>

      <form action={updateInventoryItem} className="space-y-4">
        <input type="hidden" name="id" value={item.id} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            name="name"
            defaultValue={item.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad *
            </label>
            <input
              type="number"
              name="quantity"
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
              defaultValue={item.unit}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              required
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
              defaultValue={item.lowStockThreshold ?? ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              placeholder="ejm. 10"
            />
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
              defaultValue={item.costPerUnit?.toString() ?? ""}
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
            defaultValue={item.category || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
            placeholder="ejm. Ingredientes, Bebidas"
          />
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
            href="/inventory"
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
