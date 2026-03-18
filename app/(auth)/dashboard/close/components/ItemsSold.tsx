/// app/(auth)/dashboard/close/components/ItemsSold.tsx
type MenuItem = {
  price: any;
  id: string;
  name: string;
  category: { name: string } | null;
};

type Props = {
  items: {
    menuItem: MenuItem | null;
    totalQuantity: number;
    totalSales: number;
  }[];
  totalItems: number;
  categories: { id: string; name: string }[];
  currentPage: number;
  itemsPerPage: number;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onPageChange: (page: number) => void;
};

export function ItemsSold({
  items,
  totalItems,
  categories,
  currentPage,
  itemsPerPage,
  selectedCategory,
  onCategoryChange,
  onPageChange,
}: Props) {
  const filteredItems = selectedCategory
    ? items.filter((item) => item.menuItem?.category?.name === selectedCategory)
    : items;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Ítems Vendidos ({totalItems})
      </h2>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              onCategoryChange("");
              onPageChange(1);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              !selectedCategory
                ? "bg-violet-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onCategoryChange(cat.name);
                onPageChange(1);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedCategory === cat.name
                  ? "bg-violet-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-gray-500">No se vendieron ítems hoy.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Ítem
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Platos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.menuItem?.name || "Desconocido"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.menuItem?.category?.name || "Otro"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.totalQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!hasPrevPage}
                className={`px-4 py-2 rounded ${
                  !hasPrevPage
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className={`px-4 py-2 rounded ${
                  !hasNextPage
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
