// app/settings/tables/TableItem.tsx
"use client";

import { useFormState } from "react-dom";
import { updateTable, deleteTable } from "./actions";

// ✅ Correct type definition reflecting the Prisma schema
type Table = {
  id: string;
  number: number;
  name: string | null; // Name can be null
  capacity: number;    // Capacity is required
  status: string;      // Add status if needed
  // Add other fields as needed, but only include what you actually use in this component
};

export default function TableItem({ table }: { table: Table }) {
  const [updateState, updateAction] = useFormState(updateTable, { error: "" });
  const [deleteState, deleteAction] = useFormState(deleteTable, { error: "" });

  // ✅ Visual: square (4) or rectangle (8)
  const isSquare = table.capacity === 4;
  const widthClass = isSquare ? "w-16" : "w-24";
  const heightClass = "h-16";

  // ✅ Handle potential null name for display
  const displayName = table.name || `Mesa ${table.number}`;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Visual Table */}
      <div
        className={`${widthClass} ${heightClass} border-2 border-gray-700 rounded flex items-center justify-center bg-white`}
        title={`Mesa ${table.number} - ${displayName}`}
      >
        <span className="font-bold text-gray-900">{table.number}</span>
      </div>

      {/* Name & Capacity */}
      <div className="text-center text-sm text-gray-700">
        <div className="font-medium">{displayName}</div>
        <div>{table.capacity} personas</div>
      </div>

      {/* Edit Form */}
      <form action={updateAction} className="w-full space-y-2">
        <input type="hidden" name="id" value={table.id} />
        <input
          type="text"
          name="name"
          defaultValue={table.name || ""} // Provide empty string if null
          placeholder="Nombre"
          className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded text-black bg-white"
        />
        <select
          name="capacity"
          defaultValue={table.capacity.toString()}
          className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded text-black bg-white"
        >
          <option value="4">4 personas</option>
          <option value="8">8 personas</option>
        </select>
        <div className="flex gap-1">
          <button
            type="submit"
            className="flex-1 px-1.5 py-0.5 bg-violet-500 text-white text-xs rounded hover:bg-violet-600"
          >
            Guardar
          </button>
          <form action={deleteAction} className="inline">
            <input type="hidden" name="id" value={table.id} />
            <button
              type="submit"
              className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              onClick={(e) => {
                if (!confirm(`¿Eliminar mesa ${table.number}?`))
                  e.preventDefault();
              }}
            >
              Eliminar
            </button>
          </form>
        </div>
        {updateState.error && (
          <p className="text-red-500 text-xs">{updateState.error}</p>
        )}
      </form>
    </div>
  );
}