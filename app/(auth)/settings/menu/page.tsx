// app/settings/menu/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CategoryForm from "./CategoryForm";
import MenuItemForm from "./MenuItemForm";
import MenuTable from "./MenuTable";

// ✅ Helper to convert Decimal to number
function serializeMenuItem(item: any) {
  return {
    ...item,
    price:
      typeof item.price === "object"
        ? parseFloat(item.price.toString())
        : item.price,
  };
}

export default async function MenuSettingsPage() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const menuItems = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });

  // ✅ Convert Decimal → number
  const serializedItems = menuItems.map(serializeMenuItem);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-500">
          Configuración del Menú
        </h1>
        <a
          href="/settings"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a ajustes
        </a>
      </div>

      {/* Categorías */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Categorías</h2>{" "}
          {/* ✅ text-gray-900 */}
          <CategoryForm isEdit={false} />
        </div>
        {categories.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay categorías creadas.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {" "}
            {/* ✅ full width */}
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`p-3 border rounded flex justify-between items-center ${cat.isActive
                    ? "border-gray-200"
                    : "border-gray-200 bg-gray-50"
                  }`}
              >
                <span
                  className={`text-gray-900 ${cat.isActive ? "" : "line-through text-gray-500"
                    }`}
                >
                  {cat.name}
                </span>
                <CategoryForm isEdit={true} category={cat} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Items del Menú */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Items del Menú
          </h2>
          <MenuItemForm categories={categories} isEdit={false} />
        </div>
        {categories.length === 0 ? (
          <p className="text-red-500 text-sm">
            Debe crear al menos una categoría antes de añadir items.
          </p>
        ) : serializedItems.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay items en el menú.</p>
        ) : (
          <MenuTable items={serializedItems} categories={categories} />
        )}
      </div>
    </div>
  );
}
