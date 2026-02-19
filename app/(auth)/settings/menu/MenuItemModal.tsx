// app/settings/menu/MenuItemModal.tsx
"use client";

import { useFormState } from "react-dom";
import { useEffect } from "react";
import { updateMenuItem } from "./actions";
import RecipeEditor from "./RecipeEditor";

type Category = { id: string; name: string; isActive: boolean };
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  prepTimeMin: number | null;
  categoryId: string;
  station: "KITCHEN" | "BAR";
};
type InventoryItem = {
  id: string;
  name: string;
  currentQuantity: number;
  unit: string;
  category: string | null;
};

export default function MenuItemModal({
  item,
  categories,
  inventoryItems,
  onClose,
}: {
  item: MenuItem;
  categories: Category[];
  inventoryItems: InventoryItem[];
  onClose: () => void;
}) {
  const [state, formAction] = useFormState(updateMenuItem, { error: "" });

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Editar Item del Menú
          </h3>
        </div>

        <form action={formAction} className="p-4 space-y-4">
          <input type="hidden" name="id" value={item.id} />

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              defaultValue={item.name}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <input
              type="text"
              name="description"
              defaultValue={item.description || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                name="categoryId"
                defaultValue={item.categoryId}
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.isActive ? "" : "(Inactiva)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Station */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estación de preparación *
              </label>
              <select
                name="station"
                defaultValue={item.station}
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                required
              >
                <option value="KITCHEN">Cocina</option>
                <option value="BAR">Bar</option>
              </select>
            </div>
          </div>

          {/* Price & Prep Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio *
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0"
                defaultValue={item.price}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo (min)
              </label>
              <input
                type="number"
                name="prepTimeMin"
                min="0"
                defaultValue={item.prepTimeMin || ""}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isAvailable"
              defaultChecked={item.isAvailable}
              id="isAvailable"
              className="h-4 w-4 text-violet-500"
            />
            <label htmlFor="isAvailable" className="ml-2 text-sm text-gray-700">
              Disponible en menú
            </label>
          </div>

          {/* ✅ Recipe Editor Section */}
          <div className="border-t border-gray-200 pt-4">
            <RecipeEditor
              menuItemId={item.id}
              inventoryItems={inventoryItems}
            />
          </div>

          {state.error && <p className="text-red-500 text-sm">{state.error}</p>}

          <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-white border-t border-gray-200 py-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
