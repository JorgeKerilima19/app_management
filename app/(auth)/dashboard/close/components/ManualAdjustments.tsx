// app/(auth)/dashboard/close/components/ManualAdjustments.tsx
type ManualAdjustment = {
  id: string;
  createdAt: Date;
  inventoryItem: { name: string; category: string | null };
  type: string;
  quantityChange: number;
  reason: string;
  performedBy: { name: string } | null;
};

type Props = { adjustments: ManualAdjustment[] };

export function ManualAdjustments({ adjustments }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Ajustes Manuales de Inventario ({adjustments.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Fecha
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Item
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Categoría
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Tipo
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Cambio
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Motivo
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Usuario
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {adjustments.map((adj) => (
              <tr key={adj.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {new Date(adj.createdAt).toLocaleString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {adj.inventoryItem.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {adj.inventoryItem.category || "General"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      adj.type === "RESTOCK"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {adj.type === "RESTOCK" ? "Reposición" : "Uso Manual"}
                  </span>
                </td>
                <td
                  className={`px-4 py-3 whitespace-nowrap text-sm font-mono text-right ${
                    adj.quantityChange < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {adj.quantityChange > 0 ? "+" : ""}
                  {adj.quantityChange.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {adj.reason}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {adj.performedBy?.name || "Sistema"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
