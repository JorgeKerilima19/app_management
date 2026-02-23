/// app/(auth)/storage/StorageTable.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import AddQuantityModal from "./AddQuantityModal";

export type StorageItem = {
  id: string;
  name: string;
  currentQuantity: number;
  unit: string;
  category: string | null;
  costPerUnit: number | null;
  notes: string | null;
};

export type InventoryItem = {
  [x: string]: any;
  id: string;
  name: string;
  unit: string;
};

type Props = {
  items: StorageItem[];
  inventoryItems: InventoryItem[];
};

export default function StorageTable({ items, inventoryItems }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null);

  const handleOpenModal = (item: StorageItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-700">Item</th>
              <th className="text-left p-3 font-medium text-gray-700">
                Almacén
              </th>
              <th className="text-left p-3 font-medium text-gray-700">
                Inventario
              </th>
              <th className="text-left p-3 font-medium text-gray-700">
                Unidad
              </th>
              <th className="text-left p-3 font-medium text-gray-700">
                Categoría
              </th>
              <th className="text-right p-3 font-medium text-gray-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const matchingInventory = inventoryItems.find(
                (inv) => inv.name.toLowerCase() === item.name.toLowerCase(),
              );

              return (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="p-3">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {item.notes && (
                      <div className="text-sm text-gray-500">{item.notes}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-gray-900">
                      {item.currentQuantity.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-3">
                    {matchingInventory ? (
                      <span className="font-mono text-green-700">
                        {matchingInventory.currentQuantity.toFixed(2)}{" "}
                        {matchingInventory.unit}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-700">{item.unit}</td>
                  <td className="p-3">
                    {item.category ? (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-sm">
                        {item.category}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/storage/${item.id}`}
                        className="text-violet-600 hover:text-violet-800 font-medium text-sm"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="text-green-600 hover:text-green-800 font-medium text-sm"
                      >
                        + Stock
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && selectedItem && (
        <AddQuantityModal
          item={selectedItem}
          onClose={handleCloseModal}
          onSubmitted={() => window.location.reload()}
        />
      )}
    </>
  );
}
