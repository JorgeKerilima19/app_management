/// app/inventory/TransactionHistoryModal.tsx
"use client";
import { useState, useEffect } from "react";
import { getItemTransactionHistory } from "./actions";

export default function TransactionHistoryModal({
  itemId,
  onClose,
}: {
  itemId: string;
  onClose: () => void;
}) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getItemTransactionHistory(itemId)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, [itemId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Cambios
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-4">
          {loading ? (
            <p className="text-center text-gray-500">Cargando...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-500">
              Sin historial registrado
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-right p-2">Cambio</th>
                  <th className="text-left p-2">Motivo</th>
                  <th className="text-left p-2">Por</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100">
                    <td className="p-2 text-gray-600">
                      {new Date(tx.createdAt).toLocaleString("es-PE")}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          tx.type === "RESTOCK"
                            ? "bg-green-100 text-green-800"
                            : tx.type === "MANUAL_ADJUSTMENT"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className={`p-2 text-right font-mono ${
                        tx.quantityChange < 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {tx.quantityChange > 0 ? "+" : ""}
                      {tx.quantityChange.toFixed(2)}
                    </td>
                    <td className="p-2 text-gray-700">{tx.reason}</td>
                    <td className="p-2 text-gray-600">
                      {tx.performedBy?.name || "Sistema"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
