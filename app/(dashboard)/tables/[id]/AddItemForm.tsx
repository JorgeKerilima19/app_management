// app/(dashboard)/tables/[id]/AddItemForm.tsx
"use client";

import { addItemToOrder } from "./actions";
import { useState } from "react";

export function AddItemForm({
  tableId,
  menuItem,
}: {
  tableId: string;
  menuItem: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    isAvailable: boolean;
    prepTimeMin: number | null;
    categoryId: string;
    category: { name: string };
  };
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const notesInput = form.notes as HTMLInputElement;
    const quantityInput = form.quantity as HTMLInputElement;
    notesInput.value = notes;
    quantityInput.value = quantity.toString();
    // Trigger submit via hidden button
    (form.querySelector('button[type="submit"]') as HTMLButtonElement).click();
  };

  if (!menuItem.isAvailable) {
    return (
      <div className="p-3 bg-gray-100 rounded border text-gray-500 cursor-not-allowed">
        <p className="font-medium">{menuItem.name}</p>
        <p className="text-xs">No disponible</p>
      </div>
    );
  }

  return (
    <div className="group relative bg-white rounded border hover:bg-violet-50 cursor-pointer transition">
      {showNotes ? (
        <form action={addItemToOrder} onSubmit={handleSubmit} className="p-3">
          <input type="hidden" name="tableId" value={tableId} />
          <input type="hidden" name="menuItemId" value={menuItem.id} />
          <input type="hidden" name="notes" />
          <input type="hidden" name="quantity" />
          <div className="font-medium text-gray-900">{menuItem.name}</div>
          <div className="text-xs text-gray-500 mb-2">
            {menuItem.category.name}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-gray-600">Qty:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setQuantity(isNaN(val) || val < 1 ? 1 : val);
              }}
              className="w-16 p-1 text-sm border rounded"
            />
          </div>

          {/* Notes */}
          <input
            type="text"
            placeholder="e.g., no onions, extra cheese"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-1.5 text-sm border rounded mb-2"
            autoFocus
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNotes(false)}
              className="px-2 py-1 text-xs bg-gray-200 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-2 py-1 text-xs bg-violet-600 text-white rounded"
            >
              Añadir
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3" onClick={() => setShowNotes(true)}>
          <div className="font-medium text-gray-900 group-hover:text-violet-700">
            {menuItem.name}
          </div>
          <div className="text-xs text-gray-500">{menuItem.category.name}</div>
          <div className="font-bold text-violet-600 group-hover:text-violet-800 mt-1">
            ${menuItem.price.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
