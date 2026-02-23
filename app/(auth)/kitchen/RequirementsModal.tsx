//app/kitchen/RequirementsModal.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  createDailyRequirement,
  addRequirementItem,
  getInventoryItemsForRequirements,
} from "./actions";

type InventoryItem = {
  id: string;
  name: string;
  currentQuantity: number;
  unit: string;
  category: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function RequirementsModal({ isOpen, onClose }: Props) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [requirementId, setRequirementId] = useState<string | null>(null);
  const [items, setItems] = useState<
    Array<{
      inventoryItemId: string;
      name: string;
      quantity: number;
      unit: string;
      notes: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // ✅ Fix: Get tomorrow's date in local timezone
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      // Format as YYYY-MM-DD in local timezone
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const day = String(tomorrow.getDate()).padStart(2, "0");
      setSelectedDate(`${year}-${month}-${day}`);

      async function loadInventory() {
        try {
          setFetchError(null);
          const data = await getInventoryItemsForRequirements();
          setInventoryItems(data);
        } catch (e) {
          console.error("Failed to load inventory items", e);
          setFetchError("No se pudieron cargar los items de inventario");
        }
      }
      loadInventory();
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return inventoryItems;
    const query = searchQuery.toLowerCase();
    return inventoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query)),
    );
  }, [inventoryItems, searchQuery]);

  const handleCreateRequirement = async () => {
    if (!selectedDate) {
      alert("Seleccione una fecha");
      return;
    }

    const formData = new FormData();
    formData.append("date", selectedDate);
    formData.append("notes", notes);

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

    setItems([
      ...items,
      {
        inventoryItemId: selectedItemId,
        name: item.name,
        quantity: parseFloat(quantity),
        unit: item.unit,
        notes: itemNotes,
      },
    ]);
    setSelectedItemId("");
    setQuantity("");
    setItemNotes("");
  };

  const handleRemoveItem = (inventoryItemId: string) => {
    setItems(items.filter((i) => i.inventoryItemId !== inventoryItemId));
  };

  const handleSubmitItems = async () => {
    if (!requirementId || items.length === 0) return;

    try {
      setLoading(true);
      for (const item of items) {
        const formData = new FormData();
        formData.append("requirementId", requirementId);
        formData.append("inventoryItemId", item.inventoryItemId);
        formData.append("quantity", item.quantity.toString());
        if (item.notes) formData.append("notes", item.notes);
        await addRequirementItem(formData);
      }
      alert("Requerimiento creado exitosamente");
      onClose();
      window.location.reload();
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSearchQuery("");
    setSelectedItemId("");
    setQuantity("");
    setItemNotes("");
    setItems([]);
    setRequirementId(null);
    setStep(1);
    setNotes("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white flex justify-between items-center">
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
                  Fecha *
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
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="ejm. Evento especial, fin de semana..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateRequirement}
                  disabled={loading || !selectedDate}
                  className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50"
                >
                  {loading ? "Creando..." : "Continuar"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Fecha:{" "}
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "es-PE",
                )}
              </p>

              {/* Search Bar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar ingrediente
                </label>
                <input
                  type="text"
                  placeholder="Buscar por nombre o categoría..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                />
                {searchQuery && filteredItems.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No se encontraron resultados
                  </p>
                )}
              </div>

              {/* Item Selection */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white md:col-span-2"
                >
                  <option value="">-- Seleccionar ingrediente --</option>
                  {filteredItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.currentQuantity} {item.unit})
                      {item.category && ` - ${item.category}`}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Cantidad"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
                />

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedItemId || !quantity}
                  className="px-3 py-1 bg-violet-500 text-white rounded text-sm hover:bg-violet-600 disabled:opacity-50"
                >
                  + Añadir
                </button>
              </div>

              {/* Item Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nota para este ingrediente (opcional)
                </label>
                <input
                  type="text"
                  placeholder="ejm. Solo maduros, sin semillas..."
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                />
              </div>

              {/* Selected Items List */}
              {items.length > 0 ? (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.inventoryItemId}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-gray-900">
                        {item.name} x {item.quantity} {item.unit}
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
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  {searchQuery && filteredItems.length === 0
                    ? "No se encontraron resultados"
                    : "Sin ingredientes agregados."}
                </p>
              )}

              {fetchError && (
                <p className="text-sm text-red-600">{fetchError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleSubmitItems}
                  disabled={loading || items.length === 0}
                  className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Crear Requerimiento"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
