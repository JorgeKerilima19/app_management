// app/(auth)/tables/[id]/TableOrderManager.tsx
"use client";

import { submitOrder } from "./actions";
import { useState, useEffect, useRef, useMemo } from "react";
import { MenuFilterClient } from "./MenuFilterClient";

export function TableOrderManager({
  tableId,
  tableNumber,
  currentCheck,
  menuItems,
}: {
  tableId: string;
  tableNumber: number;
  currentCheck: any;
  menuItems: any[];
}) {
  const [isSending, setIsSending] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  // 🛒 Client-side cart state
  const [cartItems, setCartItems] = useState<
    Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      notes: string;
      price: number;
      station: "KITCHEN" | "BAR";
    }>
  >([]);

  // 🛒 Cart helper functions
  const addToCart = (menuItem: any) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.menuItemId === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItemId === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          quantity: 1,
          notes: "",
          price: menuItem.price,
          station: menuItem.station,
        },
      ];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.menuItemId === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        );
      }
      return prev.filter((item) => item.menuItemId !== menuItemId);
    });
  };

  const updateCartNotes = (menuItemId: string, notes: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.menuItemId === menuItemId ? { ...item, notes } : item,
      ),
    );
  };

  // 🛒 Submit order to server + auto-print
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0 || isSending) return;

    setIsSending(true);
    const formData = new FormData();
    formData.append("tableId", tableId);
    formData.append("items", JSON.stringify(cartItems));

    try {
      await submitOrder(formData);
      setCartItems([]); // Clear cart after success
    } catch (err) {
      console.error("Error submitting order:", err);
      alert("Error al enviar la orden.");
    } finally {
      setIsSending(false);
    }
  };

  // Calculate cart total for display
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );

  return (
    <>
      <div className="space-y-6">
        {/* 🛒 Current Cart (Pending Order) */}
        {cartItems.length > 0 && (
          <div className="bg-white border border-violet-200 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-3 text-violet-600 flex items-center gap-2">
              📋 Orden actual
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {cartItems.reduce((sum, i) => sum + i.quantity, 0)} ítems
              </span>
            </h2>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {cartItems.map((item) => {
                const stationLabel = item.station === "KITCHEN" ? "" : "";
                return (
                  <div
                    key={item.menuItemId}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="font-medium flex-1 text-black min-w-0">
                      <span className="mr-1">{stationLabel}</span>
                      {item.name}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-lg font-bold transition"
                        title="Reducir cantidad"
                      >
                        –
                      </button>
                      <span className="font-bold w-6 text-center text-gray-700">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            id: item.menuItemId,
                            price: item.price,
                            station: item.station,
                          })
                        }
                        className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 hover:bg-violet-200 flex items-center justify-center text-lg font-bold transition"
                        title="Agregar otro"
                      >
                        +
                      </button>
                    </div>

                    <div className="w-full sm:w-48 mt-1 sm:mt-0">
                      <input
                        type="text"
                        placeholder="Notas..."
                        value={item.notes}
                        onChange={(e) =>
                          updateCartNotes(item.menuItemId, e.target.value)
                        }
                        className="w-full p-1.5 text-sm border border-gray-200 rounded text-black placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                    </div>

                    <div className="text-right font-bold text-gray-700 min-w-17.5">
                      S/ {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
              <span className="font-semibold text-gray-700">Subtotal:</span>
              <span className="font-bold text-lg text-violet-600">
                S/ {cartTotal.toFixed(2)}
              </span>
            </div>

            <form onSubmit={handleSubmitOrder} className="mt-4">
              <input type="hidden" name="tableId" value={tableId} />
              <button
                type="submit"
                disabled={cartItems.length === 0 || isSending}
                className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                  cartItems.length > 0 && !isSending
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow hover:shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>Enviar Orden</>
                )}
              </button>
            </form>
          </div>
        )}

        {currentCheck.orders.filter((o: any) => o.status === "SENT").length >
          0 && (
          <details className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <summary className="cursor-pointer font-semibold text-gray-700 mb-2 flex items-center gap-2">
              Órdenes enviadas (
              {
                currentCheck.orders.filter((o: any) => o.status === "SENT")
                  .length
              }
              )
            </summary>
            <div className="space-y-2 mt-2">
              {currentCheck.orders
                .filter((o: any) => o.status === "SENT")
                .flatMap((order: any) =>
                  order.items.map((item: any) => {
                    const stationIcon =
                      item.menuItem.station === "KITCHEN" ? "" : "";
                    return (
                      <div
                        key={item.id}
                        className="flex justify-between bg-white p-2.5 rounded border text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">
                            {stationIcon} {item.menuItem.name}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-gray-500 italic truncate">
                              "{item.notes}"
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            x{item.quantity}
                          </p>
                        </div>
                        <p className="font-bold text-gray-700 whitespace-nowrap ml-2">
                          S/ {(item.priceAtOrder * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    );
                  }),
                )}
            </div>
          </details>
        )}

        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <p className="text-lg font-bold text-gray-800">Total acumulado:</p>
            <p className="text-2xl font-extrabold text-violet-700">
              S/ {currentCheck.total.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl text-gray-900 font-semibold mb-4 flex items-center gap-2">
            Agregar ítems al pedido
          </h2>
          <MenuFilterClient
            tableId={tableId}
            menuItems={menuItems}
            onAddToCart={addToCart}
          />
        </div>
      </div>

      {/* Hidden print container (fallback) */}
      <div ref={printContentRef} className="hidden">
        <div className="p-4 font-mono text-xs">
          <p className="text-center font-bold">Taguchi Restaurant</p>
          <p className="text-center">Mesa {tableNumber}</p>
          <p className="text-center">{new Date().toLocaleString("es-PE")}</p>
          <hr className="my-2 border-dashed" />
          {cartItems.map((item) => (
            <div key={item.menuItemId} className="flex justify-between">
              <span>
                {item.name} x{item.quantity}
              </span>
              <span>S/ {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <hr className="my-2 border-dashed" />
          <p className="text-right font-bold">
            Total: S/ {cartTotal.toFixed(2)}
          </p>
        </div>
      </div>
    </>
  );
}
