// app/dashboard/tables/[id]/components/ActiveOrderCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MenuItem {
  id: number;
  name: string;
  price: number;
}

interface OrderItem {
  id: number;
  quantity: number;
  status: "PENDING" | "SERVED" | "CANCELLED";
  menuItem: MenuItem;
}

interface Order {
  id: number;
  status: string;
  orderItems: OrderItem[];
}

export default function ActiveOrderCard({
  order,
  tableId,
}: {
  order: Order;
  tableId: number;
}) {
  const [items, setItems] = useState<OrderItem[]>(order.orderItems);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateItemStatus = async (
    id: number,
    newStatus: "SERVED" | "CANCELLED"
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/items/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const closeOrder = async () => {
    if (!confirm("Are you sure you want to close this order?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });

      if (res.ok) {
        router.refresh(); // or redirect
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const total = items
    .filter((item) => item.status !== "CANCELLED")
    .reduce((sum, item) => sum + item.quantity * item.menuItem.price, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Active Order</h2>
          <span className="px-3 py-1 bg-violet-100 text-violet-800 text-sm font-medium rounded-full">
            LIVE
          </span>
        </div>

        <div className="space-y-3 mb-6">
          {items.map((item) => {
            const isCancelled = item.status === "CANCELLED";
            const isServed = item.status === "SERVED";
            const isPending = item.status === "PENDING";

            return (
              <div
                key={item.id}
                className={`flex justify-between items-center py-2 border-b border-gray-100 last:border-0 ${
                  isCancelled ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {isPending && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                      Pending
                    </span>
                  )}
                  {isServed && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                      Served
                    </span>
                  )}
                  <span
                    className={
                      isCancelled
                        ? "line-through text-red-500"
                        : "text-gray-800"
                    }
                  >
                    {item.quantity}x {item.menuItem.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">
                    S/ {(item.quantity * item.menuItem.price).toFixed(2)}
                  </span>

                  {!isCancelled && !isServed && (
                    <button
                      onClick={() => updateItemStatus(item.id, "SERVED")}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Mark Served
                    </button>
                  )}

                  {!isCancelled && (
                    <button
                      onClick={() => updateItemStatus(item.id, "CANCELLED")}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            <span className="font-bold text-lg">Total:</span>
            <span className="ml-2 font-bold text-violet-600">
              S/ {total.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                router.push(`/dashboard/tables/${tableId}/add-order`)
              }
              className="text-sm bg-violet-500 hover:bg-violet-600 text-white px-3 py-1.5 rounded"
            >
              Add More
            </button>
            <button
              onClick={closeOrder}
              disabled={loading}
              className="text-sm bg-gray-800 hover:bg-gray-900 text-white px-3 py-1.5 rounded disabled:opacity-75"
            >
              {loading ? "Closing..." : "Close Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
