// app/settings/menu/MenuItemForm.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createMenuItem, updateMenuItem } from "./actions";
import { Station } from "@prisma/client";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  prepTimeMin: number | null;
  station: Station; // Assuming this is defined globally or imported
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  displayOrder: number;
};

type Props = {
  categories: Category[]; // Pass categories from parent
  isEdit?: boolean;       // Optional: true for editing, false for creating (default)
  initialData?: MenuItem; // Required for editing
};

type FormStateResult = { error: string } | { success: boolean } | undefined;

const initialState: FormStateResult = { error: "" };

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="px-3 py-1 bg-violet-500 text-white rounded text-sm hover:bg-violet-600 whitespace-nowrap disabled:opacity-50"
      disabled={pending}
    >
      {pending ? "Guardando..." : isEdit ? "Guardar Cambios" : "Añadir"}
    </button>
  );
}

export default function MenuItemForm({ categories, isEdit = false, initialData }: Props) {
  // Validate that categories are provided (should not happen if parent passes correctly)
  if (!categories) {
    console.error("MenuItemForm: categories prop is undefined!");
    return <div>Error: Categorías no disponibles.</div>;
  }

  // Choose the correct action based on isEdit
  const [state, formAction] = useFormState(
    isEdit ? updateMenuItem : createMenuItem,
    initialState
  );

  // Filter active categories for the select dropdown
  const activeCategories = categories.filter((c) => c.isActive);

  return (
    <form
      action={formAction}
      className="p-3 border border-gray-200 rounded bg-gray-50 space-y-3"
    >
      {/* Hidden field for ID in edit mode */}
      {isEdit && initialData && (
        <input type="hidden" name="id" value={initialData.id} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <input
            type="text"
            name="name"
            placeholder="Nombre *"
            required
            defaultValue={isEdit && initialData ? initialData.name : ""}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
          />
        </div>

        <div>
          <select
            name="categoryId"
            required
            defaultValue={isEdit && initialData ? initialData.categoryId : ""}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
          >
            <option value="">-- Categoría --</option>
            {activeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            name="station"
            required
            defaultValue={isEdit && initialData ? initialData.station : ""}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
          >
            <option value="">-- Estación --</option>
            <option value="KITCHEN">Cocina</option>
            <option value="BAR">Bar</option>
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            name="price"
            step="0.01"
            min="0"
            placeholder="Precio *"
            required
            defaultValue={isEdit && initialData ? initialData.price : ""}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
          />
          <SubmitButton isEdit={isEdit} />
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          name="description"
          placeholder="Descripción (opcional)"
          defaultValue={isEdit && initialData ? initialData.description || "" : ""}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
        />
        <input
          type="number"
          name="prepTimeMin"
          min="0"
          placeholder="Min"
          defaultValue={isEdit && initialData ? initialData.prepTimeMin || "" : ""}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
        />
        <label className="flex items-center gap-1 text-sm text-gray-900">
          <input
            type="checkbox"
            name="isAvailable"
            defaultChecked={
              isEdit && initialData ? initialData.isAvailable : true
            } // Default to true for new items
            className="h-4 w-4 text-violet-500"
          />
          Disponible
        </label>
      </div>

      {/* Handle success and error messages */}
      {state && 'success' in state && state.success && (
        <div className="text-green-500 text-sm">Operación exitosa!</div>
      )}
      {state && 'error' in state && state.error && (
        <p className="text-red-500 text-sm">{state.error}</p>
      )}
    </form>
  );
}