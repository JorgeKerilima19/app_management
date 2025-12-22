// app/(dashboard)/cashier/components/SplitPayment.tsx
"use client";

import { useState } from "react";

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

  const assignItemToPerson = (itemId: string, personIndex: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const newPersons = [...persons];
    newPersons[personIndex].items.push(item);
    newPersons[personIndex].total += item.priceAtOrder * item.quantity;
    setPersons(newPersons);
  };

  return (
    <div className="mb-6">
      <h3 className="font-medium mb-3">Split by Person</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {persons.map((person, idx) => (
          <div
            key={idx}
            className="border-2 border-dashed border-gray-300 rounded p-3 min-h-24"
          >
            <div className="font-bold mb-1">Person {idx + 1}</div>
            <div className="text-sm text-gray-600">
              {person.items.length === 0
                ? "Click items below"
                : person.items
                    .map((i) => `${i.menuItem.name} x${i.quantity}`)
                    .join(", ")}
            </div>
            {person.items.length > 0 && (
              <div className="mt-2 font-bold">${person.total.toFixed(2)}</div>
            )}
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Items</h4>
        {items.map((item) => (
          <div
            key={item.id}
            className="text-sm bg-gray-100 p-2 rounded mb-2 cursor-pointer hover:bg-gray-200"
            onClick={() => {
              const personIndex = prompt(
                `Assign to person (1-${tableCapacity})?`
              );
              if (personIndex) {
                const idx = parseInt(personIndex, 10) - 1;
                if (idx >= 0 && idx < tableCapacity) {
                  assignItemToPerson(item.id, idx);
                }
              }
            }}
          >
            {item.menuItem.name} x{item.quantity} — $
            {(item.priceAtOrder * item.quantity).toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
}
