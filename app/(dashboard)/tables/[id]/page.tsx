// app/(dashboard)/tables/[id]/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  openTableAction,
  removeItemFromOrder,
  sendOrdersToKitchen,
} from "./actions";
import { MenuFilterClient } from "./MenuFilterClient";

// ✅ Group ALL items (not just pending)
function groupItemsByMenuItem(orders: any[]) {
  const grouped = new Map();
  orders.flatMap((order) =>
    order.items.forEach((item: any) => {
      const key = item.menuItemId;
      if (grouped.has(key)) {
        grouped.get(key).quantity += item.quantity;
        grouped.get(key).itemIds.push(item.id);
        grouped.get(key).isSent =
          grouped.get(key).isSent || order.status !== "PENDING";
      } else {
        grouped.set(key, {
          ...item,
          quantity: item.quantity,
          itemIds: [item.id],
          isSent: order.status !== "PENDING",
        });
      }
    })
  );
  return Array.from(grouped.values());
}

export default async function TablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const table = await prisma.table.findUnique({
    where: { id },
    include: {
      currentCheck: {
        include: {
          orders: {
            include: {
              items: {
                include: { menuItem: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!table) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Table not found.</p>
        <Link href="/tables" className="text-violet-600 mt-4 inline-block">
          ← Back to Tables
        </Link>
      </div>
    );
  }

  let serializedMenuItems: any[] = [];
  if (table.status === "OCCUPIED") {
    const menuItems = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: { category: true },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });
    serializedMenuItems = menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price.toString()),
      isAvailable: item.isAvailable,
      prepTimeMin: item.prepTimeMin,
      categoryId: item.categoryId,
      category: { name: item.category.name },
    }));
  }

  let serializedCheck = null;
  if (table.currentCheck) {
    serializedCheck = {
      ...table.currentCheck,
      subtotal: parseFloat(table.currentCheck.subtotal.toString()),
      tax: parseFloat(table.currentCheck.tax.toString()),
      discount: parseFloat(table.currentCheck.discount.toString()),
      total: parseFloat(table.currentCheck.total.toString()),
      orders: table.currentCheck.orders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          priceAtOrder: parseFloat(item.priceAtOrder.toString()),
        })),
      })),
    };
  }

  if (table.status === "AVAILABLE") {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Table {table.number}</h1>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            AVAILABLE
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600 mb-6 text-lg">
            Open table when customers are seated.
          </p>
          <form action={openTableAction}>
            <input type="hidden" name="tableId" value={table.id} />
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg"
            >
              Open Table
            </button>
          </form>
        </div>
        <div className="mt-8 text-center">
          <Link href="/tables" className="text-gray-600 hover:text-gray-800">
            ← Back to Tables
          </Link>
        </div>
      </div>
    );
  }

  if (table.status !== "OCCUPIED" || !serializedCheck) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 text-lg">
            Table is {table.status.toLowerCase()}. Please clean before reuse.
          </p>
        </div>
        <div className="mt-8 text-center">
          <Link href="/tables" className="text-gray-600 hover:text-gray-800">
            ← Back to Tables
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Group ALL items
  const groupedItems = groupItemsByMenuItem(serializedCheck.orders);
  const pendingItems = groupedItems.filter((item) => !item.isSent);
  const sentItems = groupedItems.filter((item) => item.isSent);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Table {table.number}</h1>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          OCCUPIED
        </span>
      </div>

      {/* SENT ITEMS */}
      {sentItems.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-90 mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Sent to Kitchen
          </h2>
          {sentItems.map((item) => (
            <div
              key={item.menuItemId}
              className="flex justify-between bg-white p-3 rounded mb-2 border"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {item.menuItem.name}
                </p>
                {item.notes && (
                  <p className="text-xs text-gray-600">"{item.notes}"</p>
                )}
                <p className="text-xs text-gray-500">x{item.quantity}</p>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded mt-1 inline-block">
                  SENT
                </span>
              </div>
              <p className="font-bold text-gray-700">
                ${(item.priceAtOrder * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* PENDING ITEMS */}
      {pendingItems.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8">
          <h2 className="text-lg font-semibold mb-3 text-violet-600">
            Pending Order
          </h2>
          {pendingItems.map((item) => (
            <div
              key={item.menuItemId}
              className="flex justify-between items-center bg-gray-50 p-3 rounded mb-2"
            >
              <div>
                <p className="font-medium">{item.menuItem.name}</p>
                {item.notes && (
                  <p className="text-xs text-gray-600">"{item.notes}"</p>
                )}
                <p className="text-xs text-gray-500">x{item.quantity}</p>
              </div>
              <form action={removeItemFromOrder}>
                <input type="hidden" name="tableId" value={table.id} />
                <input
                  type="hidden"
                  name="orderItemId"
                  value={item.itemIds[0]}
                />
                <button
                  type="submit"
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </form>
            </div>
          ))}

          <form action={sendOrdersToKitchen} className="mt-4">
            <input type="hidden" name="tableId" value={table.id} />
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium"
            >
              Enviar a Cocina
            </button>
          </form>
        </div>
      )}

      <div className="border-t pt-4 mb-8">
        <p className="text-lg font-bold text-gray-900">
          Total: ${serializedCheck.total.toFixed(2)}
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Add Items</h2>
        <MenuFilterClient tableId={table.id} menuItems={serializedMenuItems} />
      </div>

      <div className="mt-8 text-center">
        <Link href="/tables" className="text-gray-600 hover:text-gray-800">
          ← Back to Tables
        </Link>
      </div>
    </div>
  );
}
