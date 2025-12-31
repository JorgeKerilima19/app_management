// app/settings/menu/CategoryForm.tsx
"use client";

import { useFormState } from "react-dom";
import { createCategory, updateCategory, deleteCategory } from "./actions";

type Category = {
  id: string;
  name: string;
  isActive: boolean;
};

type Props = {
  isEdit: boolean;
  category?: Category;
};

export default function CategoryForm({ isEdit, category }: Props) {
  // ✅ useFormState gives you a form-compatible action
  const [state, formAction] = useFormState(
    isEdit ? updateCategory : createCategory,
    { error: "" }
  );

  const [deleteState, deleteFormAction] = useFormState(deleteCategory, {
    error: "",
  });

  if (!isEdit) {
    return (
      <form action={formAction} className="flex items-center gap-2">
        <input
          type="text"
          name="name"
          placeholder="Nueva categoría"
          required
          className="px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
        />
        <label className="flex items-center gap-1 text-sm text-gray-900">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked
            className="h-4 w-4 text-violet-500"
          />
          Activa
        </label>
        <button
          type="submit"
          className="px-2 py-1 bg-violet-500 text-white rounded text-sm hover:bg-violet-600"
        >
          Añadir
        </button>
        {state.error && (
          <span className="text-red-500 text-xs ml-2">{state.error}</span>
        )}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Edit Form */}
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={category!.id} />
        <input
          type="text"
          name="name"
          defaultValue={category!.name}
          required
          className="px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white w-32"
        />
        <label className="flex items-center gap-1 text-sm text-gray-900">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={category!.isActive}
            className="h-4 w-4 text-violet-500"
          />
          Activa
        </label>
        <button
          type="submit"
          className="px-2 py-1 bg-violet-500 text-white rounded text-sm hover:bg-violet-600"
        >
          Guardar
        </button>
      </form>

      {/* Delete Form */}
      <form action={deleteFormAction} className="inline">
        <input type="hidden" name="id" value={category!.id} />
        <button
          type="submit"
          className="text-xs text-red-500 hover:underline"
          onClick={(e) => {
            if (!confirm(`¿Eliminar "${category!.name}" y sus items?`)) {
              e.preventDefault();
            }
          }}
        >
          Eliminar
        </button>
      </form>

      {state.error && (
        <span className="text-red-500 text-xs ml-2">{state.error}</span>
      )}
    </div>
  );
}
