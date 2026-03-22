// app\(auth)\storage\TransferToInventoryModal.tsx

"use client";

import { useState, useEffect } from "react";
import { transferToInventory, getLinkedInventoryItem } from "./actions";

type StorageItem = {
  id: string;
  name: string;
  currentQuantity: number;
  unit: string;
};

type Props = {
  item: StorageItem;
  onClose: () => void;
  onSubmitted: () => void;
};

export default function TransferToInventoryModal({
  item,
  onClose,
  onSubmitted,
}: Props) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("Transferencia desde almacén");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedInventory, setLinkedInventory] = useState<{
    id: string;
    name: string;
    currentQuantity: number;
  } | null>(null);

  useEffect(() => {
    const fetchLinkedItem = async () => {
      const linked = await getLinkedInventoryItem(item.name);
      setLinkedInventory(linked);
    };
    fetchLinkedItem();
  }, [item.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantity || parseFloat(quantity) <= 0) {
      setError("Cantidad inválida");
      return;
    }

    if (parseFloat(quantity) > item.currentQuantity) {
      setError(
        `No puedes transferir más de ${item.currentQuantity} ${item.unit}`,
      );
      return;
    }

    if (!linkedInventory) {
      setError("No hay un item de inventario vinculado");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("storageItemId", item.id);
      formData.append("inventoryItemId", linkedInventory.id);
      formData.append("quantity", quantity);
      formData.append("reason", reason);

      await transferToInventory(formData);

      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al transferir");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Transferir a Inventario: {item.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Storage Stock Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Stock en Almacén:{" "}
              <span className="font-bold">
                {item.currentQuantity} {item.unit}
              </span>
            </p>
          </div>

          {/* Linked Inventory Info */}
          {linkedInventory ? (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">
                ✅ Vinculado a:{" "}
                <span className="font-bold">{linkedInventory.name}</span>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Stock actual en inventario: {linkedInventory.currentQuantity}{" "}
                {item.unit}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">
                ⚠️ No hay un item de inventario vinculado
              </p>
              <p className="text-xs text-red-600 mt-1">
                Asegúrate que el nombre coincida con un item de Inventario
              </p>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad a transferir *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="0.01"
              min="0"
              max={item.currentQuantity}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              required
              placeholder="0.00"
              disabled={loading || !linkedInventory}
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo: {item.currentQuantity} {item.unit}
            </p>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white"
              placeholder="ejm. Reposición de cocina, Producción del día"
              disabled={loading || !linkedInventory}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !linkedInventory}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Transferiendo..." : "Transferir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
