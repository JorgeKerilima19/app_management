// app/(dashboard)/settings/menu/_components/buttons.tsx
'use client';

import { createCategoryAction, createMenuItemAction } from '../actions';
import { useState } from 'react';

export function CreateCategoryButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set('name', name);
    await createCategoryAction(formData);
    setIsOpen(false);
    setName('');
    // Optional: refresh page
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-violet-500 text-white px-3 py-1.5 rounded text-sm hover:bg-violet-600"
      >
        + Añadir categoría
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-[#0000003a] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Añadir categoría</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la categoría"
                className="w-full px-3 py-2 border rounded mb-4"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
                >
                  Añadir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function CreateMenuItemButton({ categories }: { categories: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [prepTimeMin, setPrepTimeMin] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set('name', name);
    formData.set('description', description);
    formData.set('price', price);
    formData.set('categoryId', categoryId);
    if (isAvailable) formData.set('isAvailable', 'true');
    if (prepTimeMin) formData.set('prepTimeMin', prepTimeMin);

    await createMenuItemAction(formData);
    setIsOpen(false);
    // Reset form
    setName('');
    setDescription('');
    setPrice('');
    setCategoryId('');
    setIsAvailable(true);
    setPrepTimeMin('');
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-violet-500 text-white px-3 py-1.5 rounded text-sm hover:bg-violet-600"
      >
        + Añadir Menú Item
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-[#0000003a] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Añadir menú item</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de Item"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción (opcional)"
                className="w-full px-3 py-2 border rounded"
                rows={2}
              ></textarea>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Precio"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">Selecciona su categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="avail"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="avail">Disponible</label>
              </div>
              <input
                type="number"
                value={prepTimeMin}
                onChange={(e) => setPrepTimeMin(e.target.value)}
                placeholder="Tiempo de preparación (en minutos), opcional"
                className="w-full px-3 py-2 border rounded"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
                >
                  Añadir Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}