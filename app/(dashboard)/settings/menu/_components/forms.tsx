// app/(dashboard)/settings/menu/_components/forms.tsx
"use client";

import { deleteCategory } from "../actions";

export function DeleteCategoryForm({ id }: { id: string }) {
  const handleDelete = (e: React.FormEvent) => {
    if (
      !confirm(
        "Borrar esta categoría?. Todos sus items serán borrados"
      )
    ) {
      e.preventDefault();
    }
  };

  return (
    <form action={deleteCategory} onSubmit={handleDelete}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-red-500 hover:text-red-700 text-sm font-medium"
      >
        Borrar
      </button>
    </form>
  );
}
