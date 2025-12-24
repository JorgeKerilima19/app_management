// app/(dashboard)/settings/tables/_components/forms.tsx
"use client";

import { deleteTableAction, updateTableAction } from "../actions";
import { useState } from "react";

export function DeleteTableForm({
  id,
  tableNumber,
}: {
  id: string;
  tableNumber: number;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConfirming) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-red-600">Borrar Mesa {tableNumber}?</p>
        <div className="flex gap-1">
          <form action={deleteTableAction}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="text-red-500 hover:text-red-700 text-xs"
            >
              Si
            </button>
          </form>
          <button
            onClick={() => setIsConfirming(false)}
            className="text-gray-500 hover:text-gray-700 text-xs"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="text-red-500 hover:text-red-700 text-sm"
    >
      Quitar
    </button>
  );
}

export function EditTableForm({ table }: { table: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-violet-500 hover:text-violet-700 text-sm mr-2"
      >
        Editar
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-[#0000003a] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Editar Mesa</h3>
            <form
              action={updateTableAction}
              className="space-y-3"
              onSubmit={() => setIsOpen(false)}
            >
              <input type="hidden" name="id" value={table.id} />
              <input
                type="number"
                name="number"
                defaultValue={table.number}
                className="w-full px-3 py-2 border rounded"
                required
                min="1"
              />
              <select
                name="capacity"
                defaultValue={table.capacity}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="4">4 Personas</option>
                <option value="6">6 Personas</option>
              </select>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
