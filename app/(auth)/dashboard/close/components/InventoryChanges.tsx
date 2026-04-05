/// app/(auth)/dashboard/close/components/InventoryChanges.tsx
type Props = {
  changes: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    category: string | null;
    notes: string | null;
    costPerUnit: number | null;
    updatedAt: Date;
    storage_transfer: number;
  }[];
};

export function InventoryChanges({ changes }: Props) {
  return (
    <div className="bg-gray-700 rounded-xl shadow-sm border border-gray-600 p-4 md:p-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">
        Movimientos de Inventario ({changes.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-200 uppercase">
                Producto
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-200 uppercase">
                Stock Actual
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-200 uppercase">
                Transferido
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-200 uppercase">
                Costo Unit.
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-200 uppercase">
                Unidad
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-200 uppercase">
                Categoría
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-200 uppercase">
                Última Modificación
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-600">
            {changes.map((item) => (
              <tr key={item.id} className="hover:bg-gray-500">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                  {item.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  {item.quantity.toFixed(2)} {item.unit}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  {(item.storage_transfer || 0).toFixed(2)} {item.unit}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  {item.costPerUnit ? `S/ ${item.costPerUnit.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  {item.unit}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  {item.category || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  {item.updatedAt.toLocaleString("es-PE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
