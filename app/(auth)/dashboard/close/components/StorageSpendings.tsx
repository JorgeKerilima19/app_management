// app/(auth)/dashboard/close/components/StorageSpendings.tsx
type StorageTransaction = {
  id: string;
  type: string;
  storageItemName: string;
  quantityChange: number;
  costPerUnit: number;
  subtotal: number;
  category: string;
  performedBy: string;
  createdAt: Date;
};

type Props = { items: StorageTransaction[] };

export function StorageSpendings({ items }: Props) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-600 p-4 md:p-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">
        Gastos de Almacén ({items.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-100 uppercase">
                Tipo
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-100 uppercase">
                Producto
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-100 uppercase">
                Categoría
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-100 uppercase">
                Cantidad
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-100 uppercase">
                Costo Unit.
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-100 uppercase">
                Subtotal
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-100 uppercase">
                Responsable
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-500 divide-y divide-gray-600">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-500">
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.type === "PURCHASE"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.type === "PURCHASE" ? "Compra" : "Merma"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                  {item.storageItemName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  {item.category}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  {item.quantityChange.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  S/ {item.costPerUnit.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  S/ {item.subtotal.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  {item.performedBy}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
