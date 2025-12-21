// app/(dashboard)/settings/menu/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { CreateCategoryButton, CreateMenuItemButton } from './_components/buttons';
import { DeleteCategoryForm, DeleteMenuItemForm } from './_components/forms';

export default async function MenuSettingsPage() {
  const categories = await prisma.category.findMany({
    include: {
      items: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-500">Menu Settings</h1>
        <Link
          href="/settings"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Settings
        </Link>
      </div>

      {/* ===== CATEGORIES ===== */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Categories</h2>
          <CreateCategoryButton />
        </div>

        {categories.length === 0 ? (
          <p className="text-gray-500">No categories yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border border-gray-200 rounded p-4"
              >
                <div className="flex justify-between">
                  <h3 className="font-medium">{category.name}</h3>
                  <DeleteCategoryForm id={category.id} />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {category.items.length} item
                  {category.items.length !== 1 ? 's' : ''}
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
          <CreateMenuItemButton categories={categories} />
        </div>

        {categories.some((cat) => cat.items.length > 0) ? (
          <div className="space-y-3">
            {categories.flatMap((category) =>
              category.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b pb-3"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {category.name} • ${item.price.toFixed(2)}
                      {!item.isAvailable && (
                        <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">
                          Unavailable
                        </span>
                      )}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </p>
                    )}
                    {item.prepTimeMin && (
                      <p className="text-xs text-gray-500">
                        Prep: {item.prepTimeMin} min
                      </p>
                    )}
                  </div>
                  <DeleteMenuItemForm id={item.id} />
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="text-gray-500">No menu items yet.</p>
        )}
      </section>
    </div>
  );
}