// app/(auth)/cashier/TableMap.tsx
"use client";

import { useState } from "react";
import { mergeTablesAction } from "./actions";

type Table = {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: string;
  currentCheck: any;
};

export function TableMap({
  tables,
  onTableSelect,
  selectedTableId,
}: {
  tables: Table[];
  onTableSelect: (id: string) => void;
  selectedTableId: string | null;
}) {
  const [mergeMode, setMergeMode] = useState(false);
  const [firstTableId, setFirstTableId] = useState<string | null>(null);

  const handleTableClick = (tableId: string) => {
    if (mergeMode) {
      if (!firstTableId) {
        const clickedTable = tables.find((t) => t.id === tableId);
        // Only allow selecting occupied tables for merging
        if (clickedTable && clickedTable.status === "OCCUPIED") {
          setFirstTableId(tableId);
        } else if (clickedTable && clickedTable.status !== "OCCUPIED") {
          alert("Por favor, selecciona una mesa ocupada para fusionar.");
        }
      } else if (firstTableId === tableId) {
        // Deselect the first table if clicked again
        setFirstTableId(null);
      } else {
        // Select the second table for merging
        const clickedTable = tables.find((t) => t.id === tableId);
        if (clickedTable && clickedTable.status === "OCCUPIED") {
          if (
            confirm(
              `¿Estás seguro de que quieres fusionar la Mesa ${
                tables.find((t) => t.id === firstTableId)?.number
              } con la Mesa ${
                clickedTable.number
              }? Esta acción no se puede deshacer.`
            )
          ) {
            const formData = new FormData();
            // Ensure the table with the lower number becomes the "main" table (tableId1)
            // This is a common convention, adjust if needed
            const [tableId1, tableId2] =
              firstTableId < tableId
                ? [firstTableId, tableId]
                : [tableId, firstTableId];
            formData.set("tableId1", tableId1);
            formData.set("tableId2", tableId2);
            mergeTablesAction(formData)
              .then(() => {
                // Reset merge state after successful merge
                setFirstTableId(null);
                setMergeMode(false);
                // Optionally, refresh the table list here if needed
                // You might need to pass a refresh function down from CashierClientWrapper
              })
              .catch((error) => {
                console.error("Error merging tables:", error);
                alert(`Error al fusionar mesas: ${error.message}`);
                // Optionally reset state on error too
                setFirstTableId(null);
                setMergeMode(false);
              });
          }
        } else if (clickedTable && clickedTable.status !== "OCCUPIED") {
          alert("Por favor, selecciona una mesa ocupada.");
        }
      }
    } else {
      onTableSelect(tableId);
    }
  };

  const getTable = (num: number) => tables.find((t) => t.number === num);

  const renderTable = (num: number) => {
    const table = getTable(num);
    if (!table) return null; // This shouldn't happen if all numbers are rendered, but handle gracefully

    // Use table capacity to determine size (adjust logic if needed)
    // Assuming 8-seaters are the "larger" ones like 1-5 in your example, but your schema uses capacity 4/8
    // Let's map capacity 8 to the larger size (w-32 h-20) and capacity 4 to smaller (w-20 h-20)
    // If the layout numbers (1-5 being larger) are fixed, you might need a different mapping
    // const is8Seater = num >= 1 && num <= 5; // If layout defines larger tables
    const is8Seater = table.capacity === 8; // If schema defines larger tables
    const sizeClasses = is8Seater ? "w-32 h-20" : "w-20 h-20";

    // Determine color based on status
    let baseClasses =
      "rounded-lg border-2 flex items-center justify-center font-bold cursor-pointer transition transform hover:scale-105 ";
    let statusClasses = "bg-white border-gray-300 text-gray-800"; // Default for AVAILABLE

    if (table.status === "OCCUPIED") {
      statusClasses = "bg-green-500 border-green-600 text-white";
    } else if (table.status === "RESERVED") {
      statusClasses = "bg-yellow-500 border-yellow-600 text-white";
    } else if (table.status === "DIRTY") {
      statusClasses = "bg-red-500 border-red-600 text-white";
    }

    // Modify appearance if in merge mode
    if (mergeMode) {
      if (table.status !== "OCCUPIED") {
        // Dim non-occupied tables during merge mode
        statusClasses =
          "bg-gray-300 border-gray-400 text-gray-400 cursor-not-allowed opacity-50";
      } else if (firstTableId === table.id) {
        // Highlight the first selected table
        statusClasses = "bg-blue-500 border-blue-600 text-white";
      } else if (firstTableId && firstTableId !== table.id) {
        // Highlight potential merge target
        statusClasses = "bg-yellow-500 border-yellow-600 text-black";
      }
    }

    // Highlight selected table (outside merge mode)
    if (!mergeMode && selectedTableId === table.id) {
      baseClasses += "ring-4 ring-violet-500 "; // Add a ring
    }

    const isMergeable = table.status === "OCCUPIED";

    return (
      <div
        key={table.id}
        onClick={() =>
          isMergeable && mergeMode
            ? handleTableClick(table.id)
            : !mergeMode && handleTableClick(table.id)
        }
        className={`${sizeClasses} ${baseClasses} ${statusClasses} ${
          (mergeMode && table.status !== "OCCUPIED") ||
          (!mergeMode && !isMergeable)
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        }`}
        title={`${table.name || `Mesa ${table.number}`} - ${
          table.capacity
        } personas - ${table.status}`}
      >
        {table.number}
      </div>
    );
  };

  const rows = [
    { left: [12, 11, 6], right: 5 }, // top row
    { left: [13, 10, 7], right: 4 },
    { left: [14, 9, 8], right: 3 },
    { left: [15], right: 2 },
    { left: [], right: 1 }, // bottom row
  ];

  if (!Array.isArray(tables)) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="p-4 max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <button
            onClick={() => setMergeMode(!mergeMode)}
            className={`px-4 py-2 rounded-lg font-medium ${
              mergeMode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {mergeMode ? "Cancelar Mezclar" : "Mezclar mesas"}
          </button>
          {mergeMode && firstTableId && (
            <p className="text-sm text-blue-600 mt-2">
              Seleccionada Mesa:{" "}
              {tables.find((t) => t.id === firstTableId)?.number}. Click en otra
              mesa ocupada para fusionar.
            </p>
          )}
        </div>

        <h1 className="text-2xl font-bold text-violet-600 text-center mb-8">
          Vista de las mesas
        </h1>

        {/* INDOOR */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-center mb-6 text-gray-900">
            Interior
          </h2>
          <div className="flex justify-center gap-6 mb-8">
            {/* Left: 3 columns */}
            <div className="flex gap-4">
              {/* Column 1: first item of each row */}
              <div className="flex flex-col gap-4">
                {rows.map((row, idx) => (
                  <div key={`col1-${idx}`}>
                    {row.left[0] ? (
                      renderTable(row.left[0])
                    ) : (
                      <div className="w-20 h-20"></div> // Placeholder if no table
                    )}
                  </div>
                ))}
              </div>
              {/* Column 2: second item */}
              <div className="flex flex-col gap-4">
                {rows.map((row, idx) => (
                  <div key={`col2-${idx}`}>
                    {row.left[1] ? (
                      renderTable(row.left[1])
                    ) : (
                      <div className="w-20 h-20"></div>
                    )}
                  </div>
                ))}
              </div>
              {/* Column 3: third item */}
              <div className="flex flex-col gap-4">
                {rows.map((row, idx) => (
                  <div key={`col3-${idx}`}>
                    {row.left[2] ? (
                      renderTable(row.left[2])
                    ) : (
                      <div className="w-20 h-20"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Larger tables (1-5) */}
            <div className="flex flex-col justify-center gap-4 ml-12">
              {rows.map((row, idx) => (
                <div key={`right-${idx}`}>
                  {row.right ? (
                    renderTable(row.right)
                  ) : (
                    <div className="w-32 h-20"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OUTDOOR */}
        <div>
          <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">
            Exterior Patio
          </h2>
          <div className="flex justify-center gap-8">
            {renderTable(16)}
            {renderTable(17)}
          </div>
        </div>
      </div>
    </div>
  );
}
