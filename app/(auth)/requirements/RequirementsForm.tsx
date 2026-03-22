"use client";

import { useState } from "react";
import { createDailyRequirement, addRequirementItem } from "./actions";
import type { InventoryItem } from "./actions";

type Props = {
  inventoryItems: InventoryItem[];
  existingRequirementId?: string | null; // ✅ For adding to existing
};

type PendingItem = {
  inventoryItemId: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string;
};

export default function RequirementsForm({
  inventoryItems,
  existingRequirementId,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddItem = () => {
    if (!selectedItemId || !quantity) return;
    const item = inventoryItems.find((i) => i.id === selectedItemId);
    if (!item) return;

    setPendingItems([
      ...pendingItems,
      {
        inventoryItemId: selectedItemId,
        name: item.name,
        quantity: parseFloat(quantity),
        unit: item.unit,
        notes: itemNotes.trim(),
      },
    ]);
    setSelectedItemId("");
    setQuantity("");
    setItemNotes("");
  };

  const handleRemoveItem = (inventoryItemId: string) => {
    setPendingItems(
      pendingItems.filter((i) => i.inventoryItemId !== inventoryItemId),
    );
  };

  const handleSubmit = async () => {
    if (pendingItems.length === 0) {
      alert("Debe agregar al menos un ingrediente");
      return;
    }

    try {
      setLoading(true);

      // ✅ If adding to existing requirement, skip create step
      const requirementId =
        existingRequirementId || (await createNewRequirement());

      // ✅ Add all pending items
      for (const item of pendingItems) {
        await addItemToRequirement(requirementId, item);
      }

      alert(
        existingRequirementId
          ? "✅ Items agregados"
          : "✅ Requerimiento creado",
      );
      handleClose();
      window.location.reload();
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createNewRequirement = async (): Promise<string> => {
    const formData = new FormData();
    formData.append("date", selectedDate);
    formData.append("notes", notes.trim());

    const result = await createDailyRequirement(formData);

    if (!result.success) throw new Error("No se pudo crear el requerimiento");
    return result.requirementId;
  };

  const addItemToRequirement = async (
    requirementId: string,
    item: PendingItem,
  ) => {
    const formData = new FormData();
    formData.append("requirementId", requirementId);
    formData.append("inventoryItemId", item.inventoryItemId);
    formData.append("quantity", item.quantity.toString());
    if (item.notes) formData.append("notes", item.notes);

    await addRequirementItem(formData);
  };

  const handleClose = () => {
    setIsOpen(false);
    setNotes("");
    setPendingItems([]);
    setSearchQuery("");
    setSelectedItemId("");
    setQuantity("");
    setItemNotes("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium transition"
      >
        + Nuevo Requerimiento
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {existingRequirementId
              ? "Agregar Ingredientes"
              : "Nuevo Requerimiento"}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Date - only show if creating new */}
          {!existingRequirementId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha requerida *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
              />
            </div>
          )}

          {/* Notes - only show if creating new */}
          {!existingRequirementId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ej: Evento especial, fin de semana largo..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
              />
            </div>
          )}

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar ingrediente
            </label>
            <input
              type="text"
              placeholder="Nombre o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
              autoFocus
            />
          </div>

          {/* Add item form */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white sm:col-span-2"
            >
              <option value="">-- Seleccionar --</option>
              {filteredItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.currentQuantity} {item.unit})
                  {item.category && ` • ${item.category}`}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Cantidad"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
            />

            <button
              type="button"
              onClick={handleAddItem}
              disabled={!selectedItemId || !quantity}
              className="px-3 py-2 bg-violet-500 text-white rounded text-sm hover:bg-violet-600 disabled:opacity-50"
            >
              + Añadir
            </button>
          </div>

          {/* Item notes */}
          <input
            type="text"
            placeholder="Nota para este ingrediente (opcional)"
            value={itemNotes}
            onChange={(e) => setItemNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
          />

          {/* Pending items list */}
          {pendingItems.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingItems.map((item) => (
                <div
                  key={item.inventoryItemId}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <span className="text-sm text-gray-900">
                    <strong>{item.name}</strong> × {item.quantity} {item.unit}
                    {item.notes && (
                      <span className="text-gray-500"> — {item.notes}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.inventoryItemId)}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              {searchQuery && filteredItems.length === 0
                ? "No se encontraron ingredientes"
                : "Agrega ingredientes para este requerimiento"}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || pendingItems.length === 0}
              className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 text-sm"
            >
              {loading
                ? "Guardando..."
                : existingRequirementId
                  ? "✅ Agregar Items"
                  : "✅ Crear Requerimiento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
