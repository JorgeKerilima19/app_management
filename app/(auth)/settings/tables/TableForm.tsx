// app/settings/tables/TableForm.tsx
"use client";

import { useFormState } from "react-dom";
import { createTable } from "./actions";

export default function TableForm() {
  const [state, formAction] = useFormState(createTable, { error: "" });

  return (
    <form
      action={formAction}
      className="p-3 border border-gray-200 rounded bg-gray-50 space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <input
            type="text"
            name="name"
            placeholder="Nombre de la mesa *"
            required
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
          />
        </div>

        <div>
          <select
            name="capacity"
            required
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
          >
            <option value="">-- Capacidad --</option>
            <option value="4">4 personas</option>
            <option value="8">8 personas</option>
          </select>
        </div>

        <div>
          <button
            type="submit"
            className="w-full px-3 py-1 bg-violet-500 text-white rounded text-sm hover:bg-violet-600"
          >
            Añadir Mesa
          </button>
        </div>
      </div>
      {state.error && (
        <p className="text-red-500 text-sm mt-2">{state.error}</p>
      )}
    </form>
  );
}
