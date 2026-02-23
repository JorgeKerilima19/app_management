// app/(auth)/tables/[id]/MenuItemCard.tsx
"use client";

export function MenuItemCard({
  menuItem,
  onAddToCart,
}: {
  menuItem: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    isAvailable: boolean;
    prepTimeMin: number | null;
    categoryId: string;
    category: { name: string };
    station: "KITCHEN" | "BAR";
  };
  onAddToCart: (menuItem: any) => void;
}) {
  if (!menuItem.isAvailable) {
    return (
      <div className="p-3 bg-gray-100 rounded border text-gray-500 cursor-not-allowed opacity-60">
        <p className="font-medium">{menuItem.name}</p>
        <p className="text-xs">No disponible</p>
      </div>
    );
  }

  const stationLabel = menuItem.station === "KITCHEN" ? "Cocina" : "Bar";

  return (
    <div
      className="group relative bg-white rounded border border-violet-200  cursor-pointer  shadow-sm"
      onClick={() => onAddToCart(menuItem)}
    >
      <div className="p-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{menuItem.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {menuItem.category.name}
            </p>
          </div>
          <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-medium whitespace-nowrap">
            {stationLabel}
          </span>
        </div>

        <div className="flex justify-between items-end mt-2">
          {menuItem.prepTimeMin && (
            <p className="text-xs text-gray-400">{menuItem.prepTimeMin} min</p>
          )}
          <p className="font-bold text-violet-600">
            S/ {menuItem.price.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Visual feedback on hover */}
      <div className="absolute inset-0 rounded pointer-events-none opacity-0 bg-violet-50" />
    </div>
  );
}
