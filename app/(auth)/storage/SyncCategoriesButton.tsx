/// app/storage/SyncCategoriesButton.tsx
"use client";

import { useFormStatus } from "react-dom";
import { syncCategoriesFromStorage } from "./actions";

export default function SyncCategoriesButton({
  storageWithCategory,
  inventoryWithoutCategory,
}: {
  storageWithCategory: number;
  inventoryWithoutCategory: number;
}) {
  const { pending } = useFormStatus();

  const shouldShow = storageWithCategory > 0 && inventoryWithoutCategory > 0;

  if (!shouldShow) {
    return null;
  }

  return (
    <form action={syncCategoriesFromStorage}>
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        {pending
          ? "Sincronizando..."
          : `Sincronizar (${inventoryWithoutCategory} items)`}
      </button>
    </form>
  );
}
