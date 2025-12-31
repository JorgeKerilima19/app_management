// app/(auth)/tables/[id]/TableOrderManager.tsx
"use client";

import {
  addItemToOrder,
  removeItemFromOrder,
  sendOrderToStations,
  updateItemNotes,
} from "./actions";
import { useState, useEffect, useRef } from "react";
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
  const [shouldPrint, setShouldPrint] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  const pendingOrders = currentCheck.orders.filter(
    (o: any) => o.status === "PENDING"
  );
  const allOrdersForBill = currentCheck.orders.filter(
    (o: any) => o.status === "PENDING" || o.status === "SENT"
  );

  const pendingItems = pendingOrders.flatMap((order: any) =>
    order.items.map((item: any) => ({ ...item }))
  );

  const hasPendingItems = pendingItems.length > 0;

  useEffect(() => {
    if (shouldPrint && printContentRef.current) {
      const printWindow = window.open("", "_blank", "width=400,height=600");
      if (!printWindow) {
        alert("Permita ventanas emergentes para imprimir.");
        setShouldPrint(false);
        return;
      }
      const style = `<style>body{font-family:Arial,sans-serif;margin:0;padding:0}@media print{@page{size:auto;margin:2mm}body{-webkit-print-color-adjust:exact}}</style>`;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cuenta - Mesa ${tableNumber}</title>
            ${style}
          </head>
          <body>
            ${printContentRef.current.innerHTML}
            <script>window.onload=function(){window.print();setTimeout(()=>window.close(),1000);}</script>
          </body>
        </html>
      `);
      printWindow.document.close();
      setShouldPrint(false);
    }
  }, [shouldPrint, tableNumber]);

  const handleSubmitSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasPendingItems || isSending) return;
    setIsSending(true);
    const formData = new FormData(e.currentTarget);
    try {
      await sendOrderToStations(formData);
      setShouldPrint(true);
    } catch (err) {
      alert("Error al enviar la orden.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        {currentCheck.orders.filter((o: any) => o.status !== "PENDING").length >
          0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-90">
            <h2 className="text-lg font-semibold mb-3 text-gray-900">
              Órdenes enviadas
            </h2>
            {currentCheck.orders
              .filter((o: any) => o.status !== "PENDING")
              .flatMap((order: any) =>
                order.items.map((item: any) => {
                  const stationLabel =
                    item.menuItem.station === "KITCHEN" ? "Cocina" : "Bar";
                  return (
                    <div
                      key={item.id}
                      className="flex justify-between bg-white p-3 rounded mb-2 border"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.menuItem.name}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-gray-600 italic">
                            "{item.notes}"
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          x{item.quantity}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                            ENVIADO
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            {stationLabel}
                          </span>
                        </div>
                      </div>
                      <p className="font-bold text-gray-700">
                        S/ {(item.priceAtOrder * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })
              )}
          </div>
        )}

        {pendingItems.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3 text-violet-600">
              Orden actual
            </h2>
            {pendingItems.map((item: any) => {
              const stationLabel =
                item.menuItem.station === "KITCHEN" ? "Cocina" : "Bar";
              return (
                <div
                  key={item.menuItem.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50 p-3 rounded mb-3"
                >
                  <div className="font-medium flex-1 text-black">
                    {item.menuItem.name}
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {stationLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={removeItemFromOrder}>
                      <input type="hidden" name="tableId" value={tableId} />
                      <input
                        type="hidden"
                        name="menuItemId"
                        value={item.menuItem.id}
                      />
                      <button
                        type="submit"
                        className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                      >
                        –
                      </button>
                    </form>
                    <span className="font-bold w-8 text-center text-gray-700">
                      {item.quantity}
                    </span>
                    <form action={addItemToOrder}>
                      <input type="hidden" name="tableId" value={tableId} />
                      <input
                        type="hidden"
                        name="menuItemId"
                        value={item.menuItem.id}
                      />
                      <button
                        type="submit"
                        className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 hover:bg-violet-200 flex items-center justify-center"
                      >
                        +
                      </button>
                    </form>
                  </div>
                  <div className="w-full sm:w-64 mt-1 sm:mt-0">
                    <form action={updateItemNotes} className="flex">
                      <input type="hidden" name="tableId" value={tableId} />
                      <input
                        type="hidden"
                        name="menuItemId"
                        value={item.menuItem.id}
                      />
                      <input
                        type="text"
                        name="notes"
                        placeholder="Requerimientos..."
                        defaultValue={item.notes || ""}
                        className="w-full p-1.5 text-sm border rounded text-black"
                        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                        onKeyDown={(e) =>
                          e.key === "Enter" && e.preventDefault()
                        }
                      />
                    </form>
                  </div>
                </div>
              );
            })}

            <form onSubmit={handleSubmitSend} className="mt-4">
              <input type="hidden" name="tableId" value={tableId} />
              <button
                type="submit"
                disabled={!hasPendingItems || isSending}
                className={`w-full py-2 rounded-lg font-medium ${
                  hasPendingItems && !isSending
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSending ? "Enviando..." : "Enviar Orden"}
              </button>
            </form>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-lg font-bold text-gray-900">
            Total: S/ {currentCheck.total.toFixed(2)}
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl text-gray-900 font-semibold mb-4">Agregar ítems</h2>
          <MenuFilterClient tableId={tableId} menuItems={menuItems} />
        </div>
      </div>
    </>
  );
}
