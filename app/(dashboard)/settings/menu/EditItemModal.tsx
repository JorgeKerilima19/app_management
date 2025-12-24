// app/(dashboard)/settings/menu/EditItemModal.tsx
"use client";

import { updateMenuItemAction } from "./actions";
import { useState } from "react";

export function EditItemModal({
  item,
  onClose,
}: {
  item: any;
  onClose: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || "");
  const [price, setPrice] = useState(String(item.price));
  const [isAvailable, setIsAvailable] = useState(item.isAvailable);
  const [prepTimeMin, setPrepTimeMin] = useState(
    item.prepTimeMin ? String(item.prepTimeMin) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("id", item.id);
    formData.set("name", name);
    formData.set("description", description);
    formData.set("price", price);
    if (isAvailable) formData.set("isAvailable", "true");
    if (prepTimeMin) formData.set("prepTimeMin", prepTimeMin);

    try {
      await updateMenuItemAction(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Editar Item</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            className="w-full px-3 py-2 border rounded-lg"
            rows={2}
          />
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="available"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="available">Disponible</label>
          </div>
          <input
            type="number"
            value={prepTimeMin}
            onChange={(e) => setPrepTimeMin(e.target.value)}
            placeholder="Prep time (opcional en minutos)"
            className="w-full px-3 py-2 border rounded-lg"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
