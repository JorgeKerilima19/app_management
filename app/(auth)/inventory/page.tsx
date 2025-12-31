// app/inventory/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    redirect("/login");
  }

  const items = await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-600">Inventario</h1>
        <Link
          href="/inventory/add"
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Añadir Item
        </Link>
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
                  Unidad
                </th>
                <th className="text-left p-3 font-medium text-gray-700">
                  Categoría
                </th>
                <th className="text-left p-3 font-medium text-gray-700">
                  Actualizado
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
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {item.notes && (
                      <div className="text-sm text-gray-500">{item.notes}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-gray-900">
                      {item.quantity} {item.unit}
                    </span>
                  </td>
                  <td className="p-3 text-gray-700">{item.unit}</td>
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
                      href={`/inventory/${item.id}`}
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
