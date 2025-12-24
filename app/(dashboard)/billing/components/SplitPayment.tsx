// app/(dashboard)/billing/components/SplitPayment.tsx
"use client";

import { useState, DragEvent } from "react";

export function SplitPayment({
  tableCapacity,
  items,
  total,
}: {
  tableCapacity: number;
  items: any[];
  total: number;
}) {
  const [persons, setPersons] = useState(() =>
    Array(tableCapacity)
      .fill(null)
      .map(() => ({ items: [] as any[], total: 0 }))
  );
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const handleDragStart = (e: DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent, personIndex: number) => {
    e.preventDefault();
    const itemId = draggedItemId;
    if (!itemId) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const newPersons = [...persons];
    for (let i = 0; i < newPersons.length; i++) {
      newPersons[i].items = newPersons[i].items.filter((i) => i.id !== itemId);
    }
    newPersons[personIndex].items.push(item);
    newPersons[personIndex].total = newPersons[personIndex].items.reduce(
      (sum, i) => sum + i.priceAtOrder * i.quantity,
      0
    );
    setPersons(newPersons);
    setDraggedItemId(null);
  };

  const unassignedItems = items.filter(
    (item) => !persons.some((p) => p.items.some((i) => i.id === item.id))
  );
  const unassignedTotal = unassignedItems.reduce(
    (sum, item) => sum + item.priceAtOrder * item.quantity,
    0
  );

  return (
    <div className="mb-6">
      <h3 className="font-medium mb-3">Separar cuenta</h3>

      {unassignedItems.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 rounded">
          <div className="font-bold text-sm mb-1">
            Items Restantes (${unassignedTotal.toFixed(2)})
          </div>
          {unassignedItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              className="text-sm bg-white p-2 rounded mb-1 cursor-move border border-dashed border-gray-300"
            >
              {item.menuItem.name} x{item.quantity} — $
              {(item.priceAtOrder * item.quantity).toFixed(2)}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {persons.map((person, idx) => (
          <div
            key={idx}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, idx)}
            className={`min-h-24 p-3 rounded border-2 ${
              draggedItemId
                ? "border-dashed border-blue-400"
                : "border-gray-200"
            }`}
          >
            <div className="font-bold mb-1">Persona {idx + 1}</div>
            <div className="space-y-1">
              {person.items.map((item) => (
                <div key={item.id} className="text-sm bg-gray-100 p-1 rounded">
                  {item.menuItem.name} x{item.quantity} — $
                  {(item.priceAtOrder * item.quantity).toFixed(2)}
                </div>
              ))}
            </div>
            {person.items.length > 0 && (
              <div className="mt-2 font-bold">${person.total.toFixed(2)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
