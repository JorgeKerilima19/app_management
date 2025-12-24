// app/(dashboard)/inventory/edit-inventory/[id]/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";
import { updateInventoryItem } from "../actions";

// ✅ Make the component async and await params
export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
  });

  if (!item) {
    return (
      <div className="p-8">
        <p className="text-red-500">Item no encontrado.</p>
        <Link href="/inventory" className="text-violet-600 mt-4 inline-block">
          ← Volver a Inventario
        </Link>
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
          ← Vovler a Inventario
        </Link>
      </div>

      <form action={updateInventoryItem} className="space-y-4">
        <input type="hidden" name="id" value={item.id} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            name="name"
            defaultValue={item.name}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              name="quantity"
              step="0.01"
              defaultValue={item.quantity}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidad
            </label>
            <input
              type="text"
              name="unit"
              defaultValue={item.unit}
              className="w-full px-3 py-2 border rounded-lg"
              required
              placeholder="kg, botella, pcs, L..."
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
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="ejem. Ingrediente, Bebida, etc"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nota (opcional)
          </label>
          <textarea
            name="notes"
            defaultValue={item.notes || ""}
            className="w-full px-3 py-2 border rounded-lg"
            rows={2}
            placeholder="ejem, local"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
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
