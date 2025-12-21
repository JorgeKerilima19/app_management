// app/(dashboard)/inventory/edit-inventory/DeleteInventoryButton.tsx
"use client";

import { deleteInventoryItem } from "./actions";

export function DeleteInventoryButton({
  itemId,
  itemName,
}: {
  itemId: string;
  itemName: string;
}) {
  const handleDelete = () => {
    if (confirm(`Delete "${itemName}"? This cannot be undone.`)) {
      const formData = new FormData();
      formData.set("id", itemId);
      deleteInventoryItem(formData);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
    >
      Delete
    </button>
  );
}
