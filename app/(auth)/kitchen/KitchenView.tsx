// app/kitchen/KitchenView.tsx
"use client";

import { useState, useEffect } from "react";
import {
  markOrderAsReady,
  fetchActiveKitchenOrders,
  fetchPreparedToday,
} from "./actions";
import type { KitchenOrder, PreparedOrder } from "./actions";

const groupItemsByCategory = (
  items: {
    id: string;
    name: string;
    quantity: number;
    notes: string | null;
    categoryName: string;
  }[]
) => {
  const grouped: Record<string, typeof items> = {};
  items.forEach((item) => {
    if (!grouped[item.categoryName]) grouped[item.categoryName] = [];
    grouped[item.categoryName].push(item);
  });
  return grouped;
};

export default function KitchenView({
  initialActive,
  initialPrepared,
}: {
  initialActive: KitchenOrder[];
  initialPrepared: PreparedOrder[];
}) {
  const [activeOrders, setActiveOrders] = useState(initialActive);
  const [preparedOrders, setPreparedOrders] = useState(initialPrepared);

  const playSound = () => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/sounds/bell.mp3");
      audio.play().catch((e) => console.log("Sound blocked:", e));
    }
  };

  const loadOrders = async () => {
    try {
      const [active, prepared] = await Promise.all([
        fetchActiveKitchenOrders(),
        fetchPreparedToday(),
      ]);

      const newOrderIds = new Set(active.map((o) => o.id));
      const oldOrderIds = new Set(activeOrders.map((o) => o.id));
      const hasNew = active.some((o) => !oldOrderIds.has(o.id));

      if (hasNew) playSound();

      setActiveOrders(active);
      setPreparedOrders(prepared);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkReady = async (orderId: string) => {
    const formData = new FormData();
    formData.set("orderId", orderId);
    await markOrderAsReady(formData);
    loadOrders();
  };

  const getCardColor = (orderedAt: Date) => {
    const ageMin = (Date.now() - orderedAt.getTime()) / 60000;
    if (ageMin < 5) return "border-green-500 bg-green-50";
    if (ageMin < 10) return "border-yellow-500 bg-yellow-50";
    return "border-red-500 bg-red-50 animate-pulse";
  };

  return (
    <div className="space-y-8">
      {/* Active Orders - Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Órdenes Activas ({activeOrders.length})
        </h2>
        {activeOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-xl">
            No hay órdenes pendientes
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className={`border-2 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg ${getCardColor(
                  order.orderedAt
                )}`}
                onClick={() => handleMarkReady(order.id)}
              >
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 text-center">
                    {order.tableName}
                  </h3>
                  <p className="text-sm text-gray-700">
                    {order.orderedAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" • "}
                    <span className="font-medium">{order.waiterName}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  {Object.entries(groupItemsByCategory(order.items)).map(
                    ([category, items]) => (
                      <div key={category}>
                        <div className="font-bold text-gray-800 mb-1">
                          {category}
                        </div>
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span className="text-xl font-medium text-gray-900">
                              {item.name}{" "}
                              {item.quantity > 1 && `(x${item.quantity})`}
                            </span>
                            {item.notes && (
                              <span className="text-lg text-gray-600 italic">
                                "{item.notes}"
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prepared Today - TABLE */}
      {preparedOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Preparadas Hoy ({preparedOrders.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Mesa
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Items
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Por
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Hora Entrada
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Hora Entrega
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {preparedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {order.tableName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {order.items}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {order.waiterName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.orderedAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.deliveredAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
