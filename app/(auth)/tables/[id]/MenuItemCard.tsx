// app/(auth)/tables/[id]/MenuItemCard.tsx

export function MenuItemCard({
  menuItem,
  onAddToCart,
}: {
  menuItem: {
    id: string;
    name: string;
    price: number;
    isAvailable: boolean;
    station: "KITCHEN" | "BAR";
    category: { name: string };
    inventoryStock?: number | null;
    isSimpleItem?: boolean;
  };
  onAddToCart: (item: any) => void;
}) {
  const stationLabel =
    menuItem.station === "KITCHEN" ? "Comidas" : "Bebidas y/o Postres";

  const getStockStatus = () => {
    const isSimple = menuItem.isSimpleItem ?? true;
    const stock = menuItem.inventoryStock ?? null;

    if (!isSimple || stock === null) {
      return null;
    }
    if (stock <= 0) {
      return { text: "Agotado", color: "text-red-600 bg-red-50" };
    }
    if (stock <= 5) {
      return {
        text: `Solo ${stock}`,
        color: "text-amber-600 bg-amber-50",
      };
    }
    return {
      text: `${stock} disponibles`,
      color: "text-green-600 bg-green-50",
    };
  };

  const stockStatus = getStockStatus();
  const isOutOfStock =
    (menuItem.isSimpleItem ?? true) && (menuItem.inventoryStock ?? 0) === 0;

  if (!menuItem.isAvailable) {
    return (
      <div className="p-3 bg-gray-100 rounded border text-gray-500 cursor-not-allowed opacity-75">
        <p className="font-medium">{menuItem.name}</p>
        <p className="text-xs">No disponible</p>
      </div>
    );
  }

  return (
    <div
      onClick={!isOutOfStock ? () => onAddToCart(menuItem) : undefined}
      className={`group relative flex flex-col p-3 bg-white rounded border transition shadow-sm ${
        isOutOfStock
          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
          : "border-violet-200 hover:bg-violet-50 hover:border-violet-400 cursor-pointer"
      }`}
    >
      {/* ... rest of your JSX remains the same ... */}
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 group-hover:text-violet-700 truncate">
            {menuItem.name}
          </p>
          <p className="text-xs text-gray-500">{menuItem.category.name}</p>
        </div>
        <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 whitespace-nowrap">
          {stationLabel}
        </span>
      </div>

      {stockStatus && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${stockStatus.color}`}
        >
          {stockStatus.text}
        </span>
      )}

      <div className="flex justify-between items-end mt-2">
        <p className="font-bold text-violet-600 group-hover:text-violet-800">
          S/ {menuItem.price.toFixed(2)}
        </p>
      </div>

      {isOutOfStock && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
          <span className="text-red-600 font-semibold text-sm">Agotado</span>
        </div>
      )}
    </div>
  );
}
