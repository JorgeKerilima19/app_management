// app/(auth)/tables/[id]/MenuFilterClient.tsx
"use client";

import { addItemToOrder } from "./actions";
import { useState } from "react";

export function MenuFilterClient({
  tableId,
  menuItems,
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
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const categories = Array.from(
    new Set(menuItems.map((item) => item.category.name))
  ).sort();

  const filtered = selectedCategory
    ? menuItems.filter((item) => item.category.name === selectedCategory)
    : menuItems;

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
            selectedCategory === ""
              ? "bg-violet-500 text-gray-100"
              : "bg-gray-500 hover:bg-violet-400"
          }`}
          onClick={() => setSelectedCategory("")}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === category
                ? "bg-violet-500 text-gray-100"
                : "bg-gray-500 hover:bg-violet-400"
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((item) => {
          if (!item.isAvailable) return null;
          const stationLabel = item.station === "KITCHEN" ? "Cocina" : "Bar";
          return (
            <form
              key={item.id}
              action={addItemToOrder}
              className="group relative flex flex-col p-3 bg-white rounded border border-violet-700 hover:bg-violet-50 cursor-pointer transition"
            >
              <input type="hidden" name="tableId" value={tableId} />
              <input type="hidden" name="menuItemId" value={item.id} />
              <input type="hidden" name="quantity" value="1" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-violet-700">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-900">{item.category.name}</p>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded bg-violet-700 text-gray-100">
                  {stationLabel}
                </span>
              </div>
              <div className="flex justify-between items-end mt-2">
                <p className="text-xs text-gray-500">
                  {item.prepTimeMin && `${item.prepTimeMin} min`}
                </p>
                <p className="font-bold text-violet-600 group-hover:text-violet-800">
                  S/ {item.price.toFixed(2)}
                </p>
              </div>
              <button
                type="submit"
                className="absolute inset-0 w-full h-full opacity-0"
              ></button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
