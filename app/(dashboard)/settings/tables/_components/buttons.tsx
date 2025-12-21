// app/(dashboard)/settings/tables/_components/buttons.tsx
"use client";

import { createTableAction } from "../actions";
import { useState } from "react";

export function CreateTableButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-violet-500 text-white px-4 py-2 rounded hover:bg-violet-600 mb-6"
      >
        + Add New Table
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add New Table</h3>
            <form action={createTableAction} className="space-y-3">
              <input
                type="number"
                name="number"
                placeholder="Table number"
                className="w-full px-3 py-2 border rounded"
                required
                min="1"
              />
              <select
                name="capacity"
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">Select capacity</option>
                <option value="4">4 people</option>
                <option value="6">6 people</option>
              </select>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
