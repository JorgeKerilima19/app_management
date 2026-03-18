/// app/inventory/InventoryTable.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SupplyAdjustModal from "./SupplyAdjustModal";

type InventoryItem = {
  id: string;
  name: string;
  currentQuantity: number;
  unit: string;
  category: string | null;
  notes: string | null;
  lowStockThreshold: number | null;
  updatedAt: Date;
};

type Props = {
  items: InventoryItem[];
  categories: string[];
};

// Categories that typically need manual tracking
const MANUAL_TRACKING_CATEGORIES = [
  "Supplies",
  "Packaging",
  "Cleaning",
  "Limpieza",
  "Suministros",
  "Envases",
];

export default function InventoryTable({ items, categories }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(
    null,
  );

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

  return (
    <>
      {/* Filters Section */}
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

      {/* Table Section */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500">
            {searchQuery || selectedCategory
              ? "No se encontraron items con los filtros actuales"
              : "Sin items en el inventario"}
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
                  Estado
                </th>
                <th className="text-left p-3 font-medium text-gray-700">
                  Actualizado
                </th>
                <th className="text-right p-3 font-medium text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isLowStock =
                  item.lowStockThreshold !== null &&
                  item.currentQuantity <= item.lowStockThreshold;
                const isOutOfStock = item.currentQuantity <= 0;
                const isManualTrack =
                  item.category &&
                  MANUAL_TRACKING_CATEGORIES.some(
                    (c) => c.toLowerCase() === item.category?.toLowerCase(),
                  );

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      isOutOfStock
                        ? "bg-red-50"
                        : isLowStock
                          ? "bg-amber-50"
                          : ""
                    }`}
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
                      <span
                        className={`font-mono ${isOutOfStock ? "text-red-600 font-bold" : isLowStock ? "text-amber-600 font-semibold" : "text-gray-900"}`}
                      >
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
                    <td className="p-3">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                          Agotado
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                          ⚠️ Bajo ({item.lowStockThreshold})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                          ✅ En stock
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-3 items-center">
                        <Link
                          href={`/inventory/${item.id}`}
                          className="text-violet-600 hover:text-violet-800 font-medium text-sm"
                        >
                          Editar
                        </Link>

                        {/* ✅ Manual Adjustment Button */}
                        {isManualTrack && (
                          <button
                            onClick={() => setAdjustingItem(item)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition"
                            title="Registrar uso o reposición manual"
                          >
                            📝 Uso
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {adjustingItem && (
        <SupplyAdjustModal
          itemId={adjustingItem.id}
          itemName={adjustingItem.name}
          currentQuantity={adjustingItem.currentQuantity}
          unit={adjustingItem.unit}
          onClose={() => setAdjustingItem(null)}
        />
      )}
    </>
  );
}
