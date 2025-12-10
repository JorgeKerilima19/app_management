// app/dashboard/cashier/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock tables — only OCCUPIED tables have orders
const tables = [
  { id: 1, name: 'Table 1', capacity: 4, status: 'OCCUPIED', hasOrder: true },
  { id: 2, name: 'Table 2', capacity: 6, status: 'OCCUPIED', hasOrder: true },
  { id: 3, name: 'Table 3', capacity: 4, status: 'AVAILABLE', hasOrder: false },
  { id: 4, name: 'Table 4', capacity: 6, status: 'OCCUPIED', hasOrder: true },
  { id: 5, name: 'Table 5', capacity: 4, status: 'DIRTY', hasOrder: false },
  { id: 6, name: 'Table 6', capacity: 6, status: 'OCCUPIED', hasOrder: true },
];

export default function CashierPage() {
  const [selected, setSelected] = useState<number[]>([]);
  const [mergeMode, setMergeMode] = useState(false);

  const toggleSelect = (id: number) => {
    if (!mergeMode) return;
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleMerge = () => {
    if (selected.length < 2) return;
    alert(`Merging tables: ${selected.join(', ')}`);
    setSelected([]);
    setMergeMode(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cashier View</h1>
        <div className="flex gap-2">
          {mergeMode ? (
            <>
              {selected.length >= 2 && (
                <button
                  onClick={handleMerge}
                  className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-md"
                >
                  Merge ({selected.length})
                </button>
              )}
              <button
                onClick={() => {
                  setSelected([]);
                  setMergeMode(false);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setMergeMode(true)}
              className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-md"
            >
              Merge Tables
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {tables.map((table) => (
          <CashierTableCard
            key={table.id}
            table={table}
            isSelected={selected.includes(table.id)}
            mergeMode={mergeMode}
            onSelect={toggleSelect}
          />
        ))}
      </div>
    </div>
  );
}

// Unique TableCard for cashier
function CashierTableCard({
  table,
  isSelected,
  mergeMode,
  onSelect,
}: {
  table: (typeof tables)[0];
  isSelected: boolean;
  mergeMode: boolean;
  onSelect: (id: number) => void;
}) {
  const isSelectable = mergeMode && table.status === 'OCCUPIED';

  // Visual: square (4) vs wide rectangle (6)
  const shape = table.capacity === 4
    ? 'aspect-square'
    : 'aspect-[2/1]';

  const statusColor = table.status === 'OCCUPIED'
    ? 'border-violet-500 bg-violet-50'
    : table.status === 'AVAILABLE'
    ? 'border-green-500 bg-green-50'
    : 'border-gray-500 bg-gray-50';

  const handleClick = () => {
    if (mergeMode) {
      if (table.status === 'OCCUPIED') {
        onSelect(table.id);
      }
    } else if (table.hasOrder) {
      // Do nothing here — navigation handled by Link wrapper
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative rounded-lg p-3 text-center cursor-pointer transition-all
        ${shape}
        ${statusColor}
        ${isSelectable ? 'hover:ring-2 hover:ring-violet-400' : ''}
        ${isSelected ? 'ring-2 ring-violet-500 ring-offset-2' : ''}
        ${!mergeMode && table.hasOrder ? 'hover:bg-violet-100' : ''}
      `}
    >
      <div className="font-bold text-sm">{table.name}</div>
      <div className="text-xs opacity-75 mt-1">{table.capacity} seats</div>
      <div className="text-xs font-medium mt-1">{table.status}</div>

      {/* Clickable area for navigation */}
      {!mergeMode && table.hasOrder && (
        <Link
          href={`/dashboard/cashier/charge/${table.id}`}
          className="absolute inset-0"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Visual indicator: only OCCUPIED tables can be merged */}
      {mergeMode && table.status !== 'OCCUPIED' && (
        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-gray-400"></div>
      )}
    </div>
  );
}