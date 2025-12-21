// app/(dashboard)/settings/menu/_components/buttons.tsx
'use client';

import { createCategoryAction, createMenuItemAction } from '../actions';
import { useState } from 'react';

export function CreateCategoryButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-violet-500 text-white px-4 py-2 rounded hover:bg-violet-600 text-sm"
      >
        + Add Category
      </button>

      {/* ✅ Modal inside Client Component */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Category</h3>
            <form action={createCategoryAction}>
              <input
                type="text"
                name="name"
                placeholder="Category name"
                className="w-full px-3 py-2 border rounded mb-4"
                required
              />
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
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function CreateMenuItemButton({ categories }: { categories: { id: string; name: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-violet-500 text-white px-4 py-2 rounded hover:bg-violet-600 text-sm"
      >
        + Add Menu Item
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Menu Item</h3>
            <form action={createMenuItemAction} className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Item name"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <textarea
                name="description"
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border rounded"
                rows={2}
              ></textarea>
              <input
                type="number"
                name="price"
                step="0.01"
                placeholder="Price"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <select name="categoryId" className="w-full px-3 py-2 border rounded" required>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isAvailable"
                  id="isAvailable"
                  defaultChecked
                  className="mr-2"
                />
                <label htmlFor="isAvailable">Available</label>
              </div>
              <input
                type="number"
                name="prepTimeMin"
                placeholder="Prep time (min, optional)"
                className="w-full px-3 py-2 border rounded"
              />
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
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}