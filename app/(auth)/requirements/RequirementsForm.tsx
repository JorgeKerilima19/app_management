// app/(auth)/requirements/components/RequirementsForm.tsx
"use client";

import { useState } from "react";
import { createDailyRequirement, addRequirementItem } from "./actions";
import type { InventoryItem } from "./actions";

type Props = {
  inventoryItems: InventoryItem[];
};

type PendingItem = {
  inventoryItemId: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string;
};

export default function RequirementsForm({ inventoryItems }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Requirement basics
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [requirementId, setRequirementId] = useState<string | null>(null);

  // Step 2: Items
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

  const handleCreateRequirement = async () => {
    if (!selectedDate) {
      alert("Seleccione una fecha");
      return;
    }

    const formData = new FormData();
    formData.append("date", selectedDate);
    formData.append("notes", notes.trim());

    try {
      setLoading(true);
      const result = await createDailyRequirement(formData);
      if (result.success) {
        setRequirementId(result.requirementId);
        if (result.existed) {
          alert(
            "Ya existe un requerimiento para esta fecha. Añada ingredientes.",
          );
        }
        setStep(2);
      }
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmitItems = async () => {
    if (!requirementId || pendingItems.length === 0) return;

    try {
      setLoading(true);
      for (const item of pendingItems) {
        const formData = new FormData();
        formData.append("requirementId", requirementId);
        formData.append("inventoryItemId", item.inventoryItemId);
        formData.append("quantity", item.quantity.toString());
        if (item.notes) formData.append("notes", item.notes);
        await addRequirementItem(formData);
      }
      alert("✅ Requerimiento actualizado exitosamente");
      handleClose();
      window.location.reload();
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep(1);
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
            {step === 1 ? "Nuevo Requerimiento" : "Agregar Ingredientes"}
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
          {step === 1 ? (
            <>
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

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateRequirement}
                  disabled={loading || !selectedDate}
                  className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 text-sm"
                >
                  {loading ? "Creando..." : "Continuar →"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Date summary */}
              <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                📅 Fecha:{" "}
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "es-PE",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
                {notes && <span className="text-gray-500"> • {notes}</span>}
              </p>

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
                        <strong>{item.name}</strong> × {item.quantity}{" "}
                        {item.unit}
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
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                >
                  ← Atrás
                </button>
                <button
                  type="button"
                  onClick={handleSubmitItems}
                  disabled={loading || pendingItems.length === 0}
                  className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 text-sm"
                >
                  {loading ? "Guardando..." : "✅ Guardar Requerimiento"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
