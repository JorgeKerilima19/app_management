// app/(dashboard)/inventory/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function InventoryPage() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-600">Inventario</h1>
        <Link
          href="/inventory/edit-inventory"
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Añadir Item
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Sin items en el inventario</p>
          <Link
            href="/inventory/edit-inventory"
            className="text-violet-600 hover:text-violet-800 mt-2 inline-block"
          >
            Añade tu primer producto →
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium text-gray-700">
                  Item
                </th>
                <th className="text-left p-3 font-medium text-gray-700">
                  Cantidad
                </th>
                <th className="text-left p-3 font-medium text-gray-700">
                  Categoria
                </th>
                <th className="text-left p-3 font-medium text-gray-700">
                  Actualiza el
                </th>
                <th className="text-right p-3 font-medium text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="p-3">
                    <div className="font-medium">{item.name}</div>
                    {item.notes && (
                      <div className="text-sm text-gray-500">{item.notes}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="font-mono">
                      {item.quantity} {item.unit}
                    </span>
                  </td>
                  <td className="p-3">
                    {item.category ? (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-sm">
                        {item.category}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/inventory/edit-inventory/${item.id}`}
                      className="text-violet-600 hover:text-violet-800 font-medium"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
