/// app/storage/StorageTable.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import AddQuantityModal from "./AddQuantityModal";
import TransferToInventoryModal from "./TransferToInventoryModal";

type StorageItem = {
  id: string;
  name: string;
  currentQuantity: number;
  unit: string;
  category: string | null;
  costPerUnit: number | null;
  notes: string | null;
};

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
};

type Props = {
  items: StorageItem[];
  categories: string[];
  inventoryItems: InventoryItem[];
};

export default function StorageTable({
  items,
  categories,
  inventoryItems,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          (item.category && item.category.toLowerCase().includes(query)) ||
          (item.notes && item.notes.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleOpenAddModal = (item: StorageItem) => {
    setSelectedItem(item);
    setAddModalOpen(true);
  };

  const handleOpenTransferModal = (item: StorageItem) => {
    setSelectedItem(item);
    setTransferModalOpen(true);
  };

  const handleCloseModals = () => {
    setAddModalOpen(false);
    setTransferModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <>
      {/* ✅ Filters Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div>
          <input
            type="text"
            placeholder="Buscar por nombre, categoría o nota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-gray-500 mt-1 hover:text-gray-700"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              selectedCategory === ""
                ? "bg-violet-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Todas ({items.length})
          </button>
          {categories.map((category) => {
            const count = items.filter(
              (item) => item.category === category,
            ).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  selectedCategory === category
                    ? "bg-violet-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>

        <p className="text-sm text-gray-600">
          Mostrando {filteredItems.length} de {items.length} items
        </p>
      </div>

      {/* Items Table */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500">
            {searchQuery || selectedCategory
              ? "No se encontraron items con los filtros actuales"
              : "Sin items en el almacén"}
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
              }}
              className="text-violet-600 hover:text-violet-800 mt-2 text-sm"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium text-gray-700">
                  Item
                </th>
                <th className="text-left p-3 font-medium text-gray-700">
                  Cantidad
                </th>
                <th className="text-left p-3 font-medium text-gray-700">
                  Unidad
                </th>
                <th className="text-left p-3 font-medium text-gray-700">
                  Categoría
                </th>
                <th className="text-left p-3 font-medium text-gray-700">
                  Costo/Unidad
                </th>
                <th className="text-left p-3 font-medium text-gray-700">
                  En Inventario
                </th>
                <th className="text-right p-3 font-medium text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const matchingInventory = inventoryItems.find(
                  (inv) => inv.name.toLowerCase() === item.name.toLowerCase(),
                );

                return (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-3">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      {item.notes && (
                        <div className="text-sm text-gray-500">
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-gray-900">
                        {item.currentQuantity.toFixed(2)}
                      </span>
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
                    <td className="p-3 text-gray-700">
                      {item.costPerUnit
                        ? `S/ ${item.costPerUnit.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="p-3">
                      {matchingInventory ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                          ✅ Vinculado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          Sin vincular
                        </span>
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
                          onClick={() => handleOpenAddModal(item)}
                          className="text-green-600 hover:text-green-800 font-medium text-sm"
                        >
                          + Stock
                        </button>
                        {/* ✅ NEW: Transfer to Inventory Button */}
                        <button
                          onClick={() => handleOpenTransferModal(item)}
                          disabled={
                            !matchingInventory || item.currentQuantity <= 0
                          }
                          title={
                            !matchingInventory
                              ? "Primero vincula este item con Inventario"
                              : item.currentQuantity <= 0
                                ? "Sin stock para transferir"
                                : "Transferir cantidad al inventario"
                          }
                          className={`font-medium text-sm transition-colors ${
                            !matchingInventory || item.currentQuantity <= 0
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-blue-600 hover:text-blue-800"
                          }`}
                        >
                          → Inv
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {addModalOpen && selectedItem && (
        <AddQuantityModal
          item={selectedItem}
          onClose={handleCloseModals}
          onSubmitted={() => window.location.reload()}
        />
      )}

      {transferModalOpen && selectedItem && (
        <TransferToInventoryModal
          item={selectedItem}
          onClose={handleCloseModals}
          onSubmitted={() => window.location.reload()}
        />
      )}
    </>
  );
}
