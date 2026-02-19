// app/(auth)/kitchen/KitchenView.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  markOrderAsReady,
  fetchActiveKitchenOrders,
  fetchPreparedToday,
} from "./actions";
import type { KitchenOrder, PreparedOrder } from "./actions";

export default function KitchenView({
  initialActive,
  initialPrepared,
}: {
  initialActive: KitchenOrder[];
  initialPrepared: PreparedOrder[];
}) {
  const [activeOrders, setActiveOrders] = useState(initialActive);
  const [preparedOrders, setPreparedOrders] = useState(initialPrepared);
  const hasPlayedNewOrderSoundRef = useRef<Set<string>>(new Set());
  const hasPlayedColorChangeSoundRef = useRef<Set<string>>(new Set());

  const playSound = (soundFile: string) => {
    if (typeof window !== "undefined") {
      try {
        const audio = new Audio(`/sounds/${soundFile}`);
        audio.play().catch((e) => {
          console.log("Sound playback failed:", e);
        });
      } catch (e) {
        console.error("Error playing sound:", e);
      }
    }
  };

  const loadOrders = async () => {
    try {
      const [active, prepared] = await Promise.all([
        fetchActiveKitchenOrders(),
        fetchPreparedToday(),
      ]);

      const sortedActive = active.sort((a, b) => {
        const aEarliest = Math.min(
          ...a.items.map((item) => item.itemOrderedAt.getTime()),
        );
        const bEarliest = Math.min(
          ...b.items.map((item) => item.itemOrderedAt.getTime()),
        );
        return aEarliest - bEarliest;
      });

      const allItems = sortedActive.flatMap((order) =>
        order.items.map((item) => ({
          ...item,
          orderId: order.id,
          tableNumber: order.tableNumber,
          tableName: order.tableName,
          waiterName: order.waiterName,
        })),
      );
      const now = Date.now();
      const NEW_ITEM_THRESHOLD_MS = 5500;

      const newItems = allItems.filter(
        (item) =>
          now - item.itemOrderedAt.getTime() < NEW_ITEM_THRESHOLD_MS &&
          !hasPlayedNewOrderSoundRef.current.has(item.id),
      );

      if (newItems.length > 0) {
        playSound("alert.wav");
        newItems.forEach((item) =>
          hasPlayedNewOrderSoundRef.current.add(item.id),
        );
      }

      for (const item of allItems) {
        const ageMin = (now - item.itemOrderedAt.getTime()) / 60000;
        if (
          !hasPlayedColorChangeSoundRef.current.has(item.id) &&
          (ageMin >= 5 || ageMin >= 10)
        ) {
          playSound("cambio.wav");
          hasPlayedColorChangeSoundRef.current.add(item.id);
          break;
        }
      }

      setActiveOrders(sortedActive);
      setPreparedOrders(prepared);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkItemReady = async (orderItemId: string) => {
    const formData = new FormData();
    formData.set("orderItemId", orderItemId);
    await markOrderAsReady(formData);
    loadOrders();
  };

  const getCardStyles = (earliestItemTime: number) => {
    const ageMin = (Date.now() - earliestItemTime) / 60000;
    if (ageMin < 5) {
      return {
        border: "border-green-500",
        bg: "bg-green-500",
        text: "text-gray-900",
      };
    }
    if (ageMin < 10) {
      return {
        border: "border-yellow-500",
        bg: "bg-yellow-700",
        text: "text-gray-900",
      };
    }
    return {
      border: "border-red-500",
      bg: "bg-red-700 animate-pulse",
      text: "text-white",
    };
  };

  return (
    <div className="space-y-8">
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
            {activeOrders.map((order) => {
              const earliestItemTime = Math.min(
                ...order.items.map((item) => item.itemOrderedAt.getTime()),
              );
              const styles = getCardStyles(earliestItemTime);

              return (
                <div
                  key={order.id}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg ${styles.border} ${styles.bg}`}
                  onClick={() => {
                    // Mark all items in this order as ready
                    order.items.forEach((item) => handleMarkItemReady(item.id));
                  }}
                >
                  <div className="mb-4">
                    <h3
                      className={`text-2xl font-bold ${styles.text} text-center`}
                    >
                      {order.tableName}
                    </h3>
                    <p
                      className={`text-sm ${styles.text === "text-white" ? "text-white" : "text-gray-700"}`}
                    >
                      {new Date(earliestItemTime).toLocaleTimeString([], {
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
                          <div
                            className={`font-bold ${styles.text === "text-white" ? "text-white" : "text-gray-800"} mb-1`}
                          >
                            {category}
                          </div>
                          {items.map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <span
                                className={`text-xl font-medium ${styles.text}`}
                              >
                                {item.name}{" "}
                                {item.quantity > 1 && `(x${item.quantity})`}
                              </span>
                              {item.notes && (
                                <span
                                  className={`text-lg ${styles.text === "text-white" ? "text-white" : "text-gray-600"} italic`}
                                >
                                  "{item.notes}"
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              );
            })}
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

function groupItemsByCategory(items: any[]) {
  const grouped: Record<string, typeof items> = {};
  items.forEach((item) => {
    if (!grouped[item.categoryName]) grouped[item.categoryName] = [];
    grouped[item.categoryName].push(item);
  });
  return grouped;
}
