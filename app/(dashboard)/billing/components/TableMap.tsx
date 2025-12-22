// app/(dashboard)/cashier/components/TableMap.tsx
"use client";

import { useState } from "react";
import { mergeTablesAction } from "../actions";

export function TableMap({
  tables,
  onTableSelect,
  selectedTableId,
}: {
  tables: any[];
  onTableSelect: (id: string) => void;
  selectedTableId: string | null;
}) {
  const [mergeMode, setMergeMode] = useState(false);
  const [firstTableId, setFirstTableId] = useState<string | null>(null);

  const handleTableClick = (tableId: string) => {
    if (mergeMode) {
      if (!firstTableId) {
        setFirstTableId(tableId);
      } else if (firstTableId !== tableId) {
        // ✅ Confirmation before merge
        if (confirm("Merge selected tables? This cannot be undone.")) {
          const formData = new FormData();
          formData.set("tableId1", firstTableId);
          formData.set("tableId2", tableId);
          mergeTablesAction(formData);
        }
        setFirstTableId(null);
        setMergeMode(false);
      }
    } else {
      onTableSelect(tableId);
    }
  };

  const renderTable = (num: number) => {
    const table = tables.find((t) => t.number === num);
    if (!table) return null;

    const is6Seater = num >= 11 && num <= 15;
    const size = is6Seater ? "w-32 h-20" : "w-20 h-20";

    let bgColor = "bg-gray-200";
    if (table.status === "OCCUPIED") {
      if (mergeMode) {
        if (firstTableId === table.id) {
          bgColor = "bg-blue-500";
        } else {
          bgColor = "bg-yellow-500";
        }
      } else {
        bgColor = "bg-green-500";
      }
    }

    const isSelectable = table.status === "OCCUPIED";

    return (
      <button
        key={table.id}
        onClick={() => isSelectable && handleTableClick(table.id)}
        className={`${size} rounded-lg border-2 flex items-center justify-center font-bold text-white cursor-pointer transition transform hover:scale-105 ${bgColor} ${
          !isSelectable ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={!isSelectable}
      >
        {table.number}
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-4">
        <button
          onClick={() => setMergeMode(!mergeMode)}
          className={`px-4 py-2 rounded-lg font-medium ${
            mergeMode ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          {mergeMode ? "Cancel Merge" : "Merge Tables"}
        </button>
        {mergeMode && firstTableId && (
          <p className="text-sm text-blue-600 mt-2">
            Selected: Table {tables.find((t) => t.id === firstTableId)?.number}.
            Click another to merge.
          </p>
        )}
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-6 text-center">
          Indoor Dining
        </h2>
        <div className="flex justify-center gap-8">
          <div className="flex gap-4">
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4].map(renderTable)}
            </div>
            <div className="flex flex-col gap-4">
              {[5, 6, 7].map(renderTable)}
            </div>
            <div className="flex flex-col gap-4">
              {[8, 9, 10].map(renderTable)}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 ml-12">
            {[11, 12, 13, 14, 15].map(renderTable)}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-center">
          Outdoor Patio
        </h2>
        <div className="flex justify-center gap-8">
          {renderTable(16)}
          {renderTable(17)}
        </div>
      </div>
    </div>
  );
}
