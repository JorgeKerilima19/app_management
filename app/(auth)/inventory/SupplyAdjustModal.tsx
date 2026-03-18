/// app/inventory/SupplyAdjustModal.tsx
"use client";

import { useState } from "react";
import { recordSupplyAdjustment } from "./actions";

type Props = {
  itemId: string;
  itemName: string;
  currentQuantity: number;
  unit: string;
  onClose: () => void;
};

export default function SupplyAdjustModal({
  itemId,
  itemName,
  currentQuantity,
  unit,
  onClose,
}: Props) {
  const [type, setType] = useState<"USAGE" | "RESTOCK">("USAGE");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) {
      setError("Ingrese una cantidad válida");
      return;
    }

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("inventoryItemId", itemId);
    formData.append("quantity", quantity);
    formData.append(
      "reason",
      reason || (type === "USAGE" ? "Uso operativo" : "Reposición de stock"),
    );
    formData.append("type", type);

    try {
      await recordSupplyAdjustment(formData);
      onClose(); // Close on success, page will reload via revalidatePath
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            {type === "USAGE" ? "📉 Registrar Uso" : "📦 Registrar Reposición"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Item Info */}
          <div className="p-3 bg-blue-50 rounded border border-blue-100">
            <p className="text-sm font-medium text-blue-900">{itemName}</p>
            <p className="text-xs text-blue-700">
              Stock actual:{" "}
              <strong>
                {currentQuantity.toFixed(2)} {unit}
              </strong>
            </p>
          </div>

          {/* Toggle Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("USAGE")}
              className={`py-2 rounded font-medium text-sm transition ${
                type === "USAGE"
                  ? "bg-red-100 text-red-700 ring-2 ring-red-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Restar (Uso)
            </button>
            <button
              type="button"
              onClick={() => setType("RESTOCK")}
              className={`py-2 rounded font-medium text-sm transition ${
                type === "RESTOCK"
                  ? "bg-green-100 text-green-700 ring-2 ring-green-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sumar (Repo)
            </button>
          </div>

          {/* Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad ({unit}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white focus:ring-2 focus:ring-violet-500"
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white focus:ring-2 focus:ring-violet-500"
              placeholder={
                type === "USAGE"
                  ? "ej: Limpieza, Derrame, Evento"
                  : "ej: Compra semanal"
              }
            />
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded font-medium disabled:opacity-50 ${
                type === "USAGE"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
