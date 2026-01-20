// app/bar/BarView.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  markBarOrderAsReady,
  fetchActiveBarOrders,
  fetchPreparedBarToday,
} from "./actions";
import type { BarOrder, PreparedBarOrder } from "./actions";

const groupItemsByCategory = (
  items: {
    id: string;
    name: string;
    quantity: number;
    notes: string | null;
    categoryName: string;
  }[],
) => {
  const grouped: Record<string, typeof items> = {};
  items.forEach((item) => {
    if (!grouped[item.categoryName]) grouped[item.categoryName] = [];
    grouped[item.categoryName].push(item);
  });
  return grouped;
};

export default function BarView({
  initialActive,
  initialPrepared,
}: {
  initialActive: BarOrder[];
  initialPrepared: PreparedBarOrder[];
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
        fetchActiveBarOrders(),
        fetchPreparedBarToday(),
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
        playSound("bell.mp3");
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
          playSound("alert.mp3");
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

  const handleMarkReady = async (orderId: string) => {
    const formData = new FormData();
    formData.set("orderId", orderId);
    await markBarOrderAsReady(formData);
    loadOrders();
  };

  // ✅ Updated getCardStyles to use earliest item time
  const getCardStyles = (earliestItemTime: number) => {
    const ageMin = (Date.now() - earliestItemTime) / 60000;
    if (ageMin < 5) {
      return {
        border: "border-green-500",
        bg: "bg-green-50",
        text: "text-gray-900",
      };
    }
    if (ageMin < 10) {
      return {
        border: "border-yellow-500",
        bg: "bg-yellow-50",
        text: "text-gray-900",
      };
    }
    return {
      border: "border-red-500",
      bg: "bg-red-50 animate-pulse",
      text: "text-gray-900",
    };
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Active Orders - TABLET OPTIMIZED */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Órdenes de Bar ({activeOrders.length})
        </h2>
        {activeOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-12 text-2xl">
            No hay órdenes pendientes
          </p>
        ) : (
          <div className="space-y-6">
            {" "}
            {/* Always 1 column on tablet */}
            {activeOrders.map((order) => {
              // ✅ Calculate earliest item time for this order
              const earliestItemTime = Math.min(
                ...order.items.map((item) => item.itemOrderedAt.getTime()),
              );
              const styles = getCardStyles(earliestItemTime);

              return (
                <div
                  key={order.id}
                  className={`border-2 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg min-h-48 ${styles.border} ${styles.bg}`}
                  onClick={() => handleMarkReady(order.id)}
                >
                  {/* Table & Time - Larger */}
                  <div className="mb-5">
                    <h3
                      className={`text-3xl font-bold ${styles.text} text-center`}
                    >
                      {order.tableName}
                    </h3>
                    <p className={`text-xl ${styles.text} text-center mt-2`}>
                      {new Date(earliestItemTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" • "}
                      <span className="font-bold">{order.waiterName}</span>
                    </p>
                  </div>

                  {/* Items - Larger text */}
                  <div className="space-y-4">
                    {Object.entries(groupItemsByCategory(order.items)).map(
                      ([category, items]) => (
                        <div
                          key={category}
                          className="pt-2 border-t border-gray-200"
                        >
                          <div
                            className={`font-bold ${styles.text} text-xl mb-2`}
                          >
                            {category}
                          </div>
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-start"
                            >
                              <span
                                className={`text-2xl font-medium ${styles.text}`}
                              >
                                {item.name}{" "}
                                {item.quantity > 1 && `(x${item.quantity})`}
                              </span>
                              {item.notes && (
                                <span
                                  className={`text-xl ${styles.text === "text-white" ? "text-white" : "text-gray-600"} italic`}
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

      {/* Prepared Today - TABLET OPTIMIZED TABLE */}
      {preparedOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Preparadas Hoy ({preparedOrders.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white border border-gray-200 rounded-xl">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                    Mesa
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                    Por
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                    Entrada
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                    Entrega
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {preparedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-lg font-medium text-gray-900">
                      {order.tableName}
                    </td>
                    <td className="px-4 py-4 text-lg text-gray-800 max-w-xs">
                      {order.items}
                    </td>
                    <td className="px-4 py-4 text-lg text-gray-700">
                      {order.waiterName}
                    </td>
                    <td className="px-4 py-4 text-lg text-gray-600">
                      {order.orderedAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-4 text-lg text-gray-600">
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
