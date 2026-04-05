import { Turn } from "./CloseClient";

export function TurnSummary({ turns }: { turns: Turn[] }) {
  if (turns.length === 0) return null;

  const totalVariance = turns.reduce((sum, t) => sum + (t.variance || 0), 0);

  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-600 p-6">
      <h3 className="text-lg font-semibold text-violet-500 mb-4">
        Resumen por Turnos
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase">
                Turno
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase">
                Inicio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase">
                Cierre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase">
                Ventas
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase">
                Cerrado por
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-700 divide-y divide-gray-600">
            {turns.map((turn) => (
              <tr key={turn.name} className="hover:bg-gray-500">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                  {turn.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  S/ {turn.start.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  {turn.end !== null ? `S/ ${turn.end.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  {turn.salesSnapshot?.total !== undefined
                    ? `S/ ${turn.salesSnapshot.total.toFixed(2)}`
                    : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                  {turn.closedByName || "—"}
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-gray-900 font-semibold">
              <td className="px-4 py-3 text-sm text-gray-100">Total</td>
              <td className="px-4 py-3 text-sm text-gray-100">
                S/ {turns.reduce((s, t) => s + t.start, 0).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-100">
                S/ {turns.reduce((s, t) => s + (t.end || 0), 0).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-100">
                S/{" "}
                {turns
                  .reduce((s, t) => s + (t.salesSnapshot?.total || 0), 0)
                  .toFixed(2)}
              </td>
              <td
                className={`px-4 py-3 text-sm ${
                  totalVariance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalVariance >= 0 ? "+" : ""}
                {totalVariance.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-100">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
