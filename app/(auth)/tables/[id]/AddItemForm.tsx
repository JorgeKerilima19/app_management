// app/(auth)/tables/[id]/AddItemForm.tsx
"use client";

import { useState } from "react";

export function AddItemForm({
  menuItem,
  onAddToCart,
}: {
  menuItem: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    isAvailable: boolean;
    prepTimeMin: number | null;
    categoryId: string;
    category: { name: string };
    station: "KITCHEN" | "BAR";
  };
  onAddToCart: (menuItem: any, quantity: number, notes: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(menuItem, quantity, notes.trim() || "");
    setShowNotes(false);
    setNotes("");
    setQuantity(1);
  };

  if (!menuItem.isAvailable) {
    return (
      <div className="p-3 bg-gray-100 rounded border text-gray-500 cursor-not-allowed">
        <p className="font-medium">{menuItem.name}</p>
        <p className="text-xs">No disponible</p>
      </div>
    );
  }

  const stationLabel = menuItem.station === "KITCHEN" ? "Cocina" : "Bar";

  return (
    <div className="group relative bg-white rounded border hover:bg-violet-50 cursor-pointer transition">
      {showNotes ? (
        <div className="p-3" onClick={(e) => e.stopPropagation()}>
          <div className="font-medium text-gray-900">{menuItem.name}</div>
          <div className="text-xs text-gray-500 mb-1">
            {menuItem.category.name}
          </div>
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 mb-2 inline-block">
            {stationLabel}
          </span>
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
              className="w-16 p-1 text-sm border rounded text-black"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <input
            type="text"
            placeholder="e.g., no onions"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-1.5 text-sm border rounded mb-2 text-black"
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAdd(e as any);
              }
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotes(false);
              }}
              className="px-2 py-1 text-xs bg-gray-200 rounded"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="px-2 py-1 text-xs bg-violet-600 text-white rounded"
            >
              Añadir
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3" onClick={() => setShowNotes(true)}>
          <div className="font-medium text-gray-900 group-hover:text-violet-700">
            {menuItem.name}
          </div>
          <div className="text-xs text-gray-500">{menuItem.category.name}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
              {stationLabel}
            </span>
            <span className="font-bold text-violet-600 group-hover:text-violet-800">
              S/ {menuItem.price.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
