// app/(auth)/dashboard/close/components/VoidRecords.tsx
type Props = {
  records: {
    id: string;
    voidedBy: { name: string } | null;
    target: string;
    targetDetails: string;
    totalVoided: number;
    reason: string;
    createdAt: Date;
  }[];
};

export function VoidRecords({ records }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Anulaciones ({records.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Personal
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Tipo
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Detalles
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Total anulados
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Motivo
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Hora
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
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
                  {record.targetDetails || "Sin detalles"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.totalVoided}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {record.reason || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {new Date(record.createdAt).toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
