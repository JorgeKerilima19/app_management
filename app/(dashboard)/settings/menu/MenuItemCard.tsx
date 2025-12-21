// app/(dashboard)/settings/menu/MenuItemCard.tsx
"use client";

import { deleteMenuItem } from "./actions";
import { EditItemModal } from "./EditItemModal";
import { useState } from "react";

export default function MenuItemCard({ item }: { item: any }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-900">{item.name}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-violet-600 hover:text-violet-800 text-sm"
          >
            Edit
          </button>
          <form
            action={deleteMenuItem}
            onSubmit={(e) => {
              if (!confirm(`Delete "${item.name}"?`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      {item.description && (
        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
      )}

      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-violet-600">
          ${item.price.toFixed(2)}
        </span>
        {!item.isAvailable && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
            Unavailable
          </span>
        )}
      </div>

      {isEditing && (
        <EditItemModal item={item} onClose={() => setIsEditing(false)} />
      )}
    </div>
  );
}
