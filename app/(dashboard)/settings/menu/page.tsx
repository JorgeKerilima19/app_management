// app/(dashboard)/settings/menu/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { CreateCategoryButton, CreateMenuItemButton } from './_components/buttons';
import { DeleteCategoryForm } from './_components/forms';
import MenuItemCard from './MenuItemCard';

export default async function MenuSettingsPage() {
  const categories = await prisma.category.findMany({
    include: { items: true },
    orderBy: { name: 'asc' },
  });

  // ✅ Fix Decimal → number
  const serializedCategories = categories.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({
      ...item,
      price: parseFloat(item.price.toString()),
    })),
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-600">Administrar Menu</h1>
        <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver a Ajustes
        </Link>
      </div>

      {/* ===== CATEGORIES ===== */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Categorias</h2>
          <CreateCategoryButton />
        </div>
        {serializedCategories.length === 0 ? (
          <p className="text-gray-500">Sin Categorias creadas</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serializedCategories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded p-4">
                <div className="flex justify-between">
                  <h3 className="font-medium">{category.name}</h3>
                  <DeleteCategoryForm id={category.id} />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {category.items.length} item{category.items.length !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== MENU ITEMS ===== */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Menu Items</h2>
          <CreateMenuItemButton categories={serializedCategories} />
        </div>

        {serializedCategories.length === 0 ? (
          <p className="text-gray-500">Primero crea una categoría.</p>
        ) : serializedCategories.every(cat => cat.items.length === 0) ? (
          <p className="text-gray-500">Sin items de Menú.</p>
        ) : (
          <div className="space-y-6">
            {serializedCategories.map((category) =>
              category.items.length > 0 ? (
                <div key={category.id}>
                  <div className="flex items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                    <div className="flex-1 border-t border-gray-200 ml-3"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.items.map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </section>
    </div>
  );
}