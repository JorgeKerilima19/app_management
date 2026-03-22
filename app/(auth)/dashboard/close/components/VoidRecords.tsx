// app/(auth)/dashboard/close/components/VoidRecords.tsx

type Props = {
  records: {
    id: string;
    voidedBy: { name: string } | null;
    target: string; // "Item Anulado", "Orden Anulada", "Cuenta Anulada"
    targetDetails: string;
    totalVoided: number;
    reason: string;
    createdAt: Date;
    _metadata?: any;
  }[];
};

export function VoidRecords({ records }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Anulaciones ({records.length})
        </h2>
        {records.length > 0 && (
          <span className="text-sm text-gray-500">
            Total anulado: S/{" "}
            {records
              .reduce((sum, r) => {
                // ✅ ORDER_ITEM: Calculate from metadata
                if (
                  r._metadata?.menuItem?.price &&
                  r._metadata?.quantities?.voided
                ) {
                  return (
                    sum +
                    parseFloat(r._metadata.menuItem.price) *
                      r._metadata.quantities.voided
                  );
                }
                // ✅ CHECK: Use check total from metadata
                if (
                  r.target === "Cuenta Anulada" &&
                  r._metadata?.check?.total
                ) {
                  return sum + parseFloat(r._metadata.check.total);
                }
                return sum;
              }, 0)
              .toFixed(2)}
          </span>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No hay anulaciones hoy</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Hora
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Personal
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Detalles
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Cant.
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Total (S/)
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Motivo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => {
                // ✅ Calculate amount with better fallbacks
                let amount = "—";

                if (
                  record._metadata?.menuItem?.price &&
                  record._metadata?.quantities?.voided
                ) {
                  // ORDER_ITEM
                  amount = (
                    parseFloat(record._metadata.menuItem.price) *
                    record._metadata.quantities.voided
                  ).toFixed(2);
                } else if (
                  record.target === "Cuenta Anulada" &&
                  record._metadata?.check?.total
                ) {
                  // CHECK
                  amount = parseFloat(record._metadata.check.total).toFixed(2);
                } else if (record.target === "Orden Anulada") {
                  // ORDER: No specific amount, show dash
                  amount = "—";
                }

                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.createdAt).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.voidedBy?.name || "Desconocido"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.target === "Cuenta Anulada"
                            ? "bg-red-100 text-red-800"
                            : record.target === "Orden Anulada"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {record.target}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                      <div className="truncate" title={record.targetDetails}>
                        {record.targetDetails || "Sin detalles"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {record.totalVoided}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                      {amount !== "—" ? `S/ ${amount}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                      <div className="truncate" title={record.reason}>
                        {record.reason || "—"}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
