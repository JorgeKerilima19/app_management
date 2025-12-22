// app/(dashboard)/tables/[id]/TableOrderManager.tsx
'use client';

import {
  addItemToOrder,
  removeItemFromOrder,
  sendOrdersToKitchen,
} from './actions';
import { useState, useMemo } from 'react';

function groupPendingItems(pendingOrders: any[]) {
  const grouped = new Map();
  pendingOrders.flatMap(order =>
    order.items.forEach((item: any) => {
      const key = item.menuItemId;
      if (grouped.has(key)) {
        grouped.get(key).quantity += item.quantity;
        grouped.get(key).ids.push(item.id);
      } else {
        grouped.set(key, {
          ...item,
          quantity: item.quantity,
          ids: [item.id],
        });
      }
    })
  );
  return Array.from(grouped.values());
}

export function TableOrderManager({
  tableId,
  currentCheck,
  menuItems,
}: {
  tableId: string;
  currentCheck: any;
  menuItems: any[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const pendingOrders = currentCheck.orders.filter((o: any) => o.status === 'PENDING');
  const sentOrders = currentCheck.orders.filter((o: any) => o.status !== 'PENDING');
  const groupedPending = useMemo(() => groupPendingItems(pendingOrders), [pendingOrders]);

  const categories = useMemo(() => {
    return Array.from(new Set(menuItems.map((item: any) => item.category.name))).sort();
  }, [menuItems]);

  const filteredMenu = selectedCategory
    ? menuItems.filter((item: any) => item.category.name === selectedCategory)
    : menuItems;

  return (
    <div className="space-y-8">
      {/* SENT ORDERS (FIRST) */}
      {sentOrders.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-90">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Sent to Kitchen</h2>
          {sentOrders.flatMap((order: any) =>
            order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between bg-white p-3 rounded mb-2 border">
                <div>
                  <p className="font-medium text-gray-800">{item.menuItem.name}</p>
                  {item.notes && <p className="text-xs text-gray-600">"{item.notes}"</p>}
                  <p className="text-xs text-gray-500">x{item.quantity}</p>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded mt-1 inline-block">
                    {order.status}
                  </span>
                </div>
                <p className="font-bold text-gray-700">
                  ${(item.priceAtOrder * item.quantity).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* PENDING ORDERS */}
      {groupedPending.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-3 text-violet-600">Pending Order</h2>
          {groupedPending.map((item: any) => (
            <div key={item.menuItemId} className="flex justify-between items-center bg-gray-50 p-3 rounded mb-2">
              <div>
                <p className="font-medium">{item.menuItem.name}</p>
                {item.notes && <p className="text-xs text-gray-600">"{item.notes}"</p>}
                <p className="text-xs text-gray-500">x{item.quantity}</p>
              </div>
              <form action={removeItemFromOrder}>
                <input type="hidden" name="tableId" value={tableId} />
                <input type="hidden" name="orderItemId" value={item.ids[0]} />
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
            <input type="hidden" name="tableId" value={tableId} />
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium"
            >
              ✅ Send All to Kitchen
            </button>
          </form>
        </div>
      )}

      {/* TOTAL */}
      <div className="border-t pt-4">
        <p className="text-lg font-bold text-gray-900">
          Total: ${(currentCheck.total).toFixed(2)}
        </p>
      </div>

      {/* MENU */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Add Items</h2>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              selectedCategory === ''
                ? 'bg-violet-100 text-violet-800'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedCategory('')}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-violet-100 text-violet-800'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
          {filteredMenu.map((item: any) => (
            <form
              key={item.id}
              action={addItemToOrder}
              className="group flex justify-between p-3 bg-white rounded border hover:bg-violet-50 cursor-pointer transition"
            >
              <input type="hidden" name="tableId" value={tableId} />
              <input type="hidden" name="menuItemId" value={item.id} />
              <input type="hidden" name="quantity" value="1" />
              <div>
                <p className="font-medium text-gray-900 group-hover:text-violet-700">{item.name}</p>
                <p className="text-xs text-gray-500">{item.category.name}</p>
              </div>
              <p className="font-bold text-violet-600 group-hover:text-violet-800">
                ${item.price.toFixed(2)}
              </p>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}