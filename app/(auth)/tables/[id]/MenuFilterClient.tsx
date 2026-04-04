// app/(auth)/tables/[id]/MenuFilterClient.tsx
"use client";

import { useState, useMemo } from "react";
import { MenuItemCard } from "./MenuItemCard";

export function MenuFilterClient({
  tableId,
  menuItems,
  onAddToCart,
}: {
  tableId: string;
  menuItems: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    isAvailable: boolean;
    prepTimeMin: number | null;
    categoryId: string;
    category: { name: string };
    station: "KITCHEN" | "BAR";
  }[];
  onAddToCart: (menuItem: any) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = useMemo(
    () =>
      Array.from(new Set(menuItems.map((item) => item.category.name))).sort(),
    [menuItems],
  );

  const filtered = useMemo(() => {
    let result = menuItems.filter((item) => item.isAvailable);

    // Filter by category
    if (selectedCategory) {
      result = result.filter((item) => item.category.name === selectedCategory);
    }

    // Filter by search query (name or description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description?.toLowerCase().includes(query) ?? false),
      );
    }

    return result;
  }, [menuItems, selectedCategory, searchQuery]);

  return (
    <div>
      <div className="mb-4 sticky top-0 pb-2 z-10">
        <input
          type="text"
          placeholder="Buscar plato o bebida..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-white placeholder-gray-600"
        />
      </div>

      {/* 📂 Category Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
        <button
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
            selectedCategory === ""
              ? "bg-violet-500 text-white shadow"
              : "bg-gray-100 hover:bg-violet-100 text-gray-700"
          }`}
          onClick={() => setSelectedCategory("")}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
              selectedCategory === category
                ? "bg-violet-500 text-white shadow"
                : "bg-gray-100 hover:bg-violet-100 text-gray-700"
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchQuery
              ? " No se encontraron resultados"
              : "No hay ítems disponibles"}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 text-violet-600 hover:underline text-sm"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <MenuItemCard
              key={item.id}
              menuItem={item}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        {filtered.length} ítem{filtered.length !== 1 ? "s" : ""} mostrado
        {filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
