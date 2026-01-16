// app/settings/menu/MenuTable.tsx
"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { deleteMenuItem } from "./actions";
import MenuItemModal from "./MenuItemModal";

type Category = { id: string; name: string; isActive: boolean };
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  prepTimeMin: number | null;
  categoryId: string;
  station: "KITCHEN" | "BAR";
  category: { name: string };
};

type Props = {
  items: MenuItem[];
  categories: Category[];
};

export default function MenuTable({ items, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | "all">(
    "all"
  );
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const activeCategories = categories.filter((c) => c.isActive);
  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((item) => item.categoryId === selectedCategory);

  return (
    <>
      {/* Category Filter — Buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1 text-sm rounded-full ${
            selectedCategory === "all"
              ? "bg-violet-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Todas
        </button>
        {activeCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 text-sm rounded-full ${
              selectedCategory === cat.id
                ? "bg-violet-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Item
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Categoría
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Precio
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Tiempo (min)
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Disponible
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                  No hay items en esta categoría.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, index) => (
                <TableRow
                  key={item.id}
                  item={item}
                  index={index}
                  activeCategories={activeCategories}
                  onEdit={() => setEditingItem(item)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingItem && (
        <MenuItemModal
          item={editingItem}
          categories={activeCategories}
          onClose={() => setEditingItem(null)}
        />
      )}
    </>
  );
}

// ✅ Separate row component to manage useFormState per row
function TableRow({
  item,
  index,
  activeCategories,
  onEdit,
}: {
  item: MenuItem;
  index: number;
  activeCategories: Category[];
  onEdit: () => void;
}) {
  const [, deleteFormAction] = useFormState(deleteMenuItem, { error: "" });

  return (
    <tr className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
      <td className="px-4 py-3 text-gray-900">
        <div className="font-medium">{item.name}</div>
        {item.description && (
          <div className="text-sm text-gray-600">{item.description}</div>
        )}
      </td>
      <td className="px-4 py-3 text-gray-900">{item.category.name}</td>
      <td className="px-4 py-3 text-gray-900">S/ {item.price.toFixed(2)}</td>
      <td className="px-4 py-3 text-gray-900">
        {item.prepTimeMin ? `${item.prepTimeMin} min` : "-"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-0.5 text-xs rounded-full ${
            item.isAvailable
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.isAvailable ? "Sí" : "No"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-3">
          <button
            onClick={onEdit}
            className="text-xs text-violet-500 hover:underline"
          >
            Editar
          </button>
          <form action={deleteFormAction} className="inline">
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="text-xs text-red-500 hover:underline"
              onClick={(e) => {
                if (
                  !confirm(
                    "¿Eliminar este item? Esta acción no se puede deshacer."
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              Eliminar
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
