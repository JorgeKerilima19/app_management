// app/(dashboard)/tables/[id]/TableOrderManager.tsx
"use client";

import {
  addItemToOrder,
  removeItemFromOrder,
  sendOrdersToKitchen,
  updateItemNotes,
} from "./actions";
import { useState, useEffect, useRef } from "react";
import { MenuFilterClient } from "./MenuFilterClient";
import { CustomerBillPrint } from "./CustomerBillPrint";

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

  // 🔁 Trigger print when shouldPrint becomes true
  useEffect(() => {
    if (shouldPrint && printContentRef.current) {
      const printWindow = window.open("", "_blank", "width=400,height=600");
      if (!printWindow) {
        alert("Please allow pop-ups to print the bill.");
        setShouldPrint(false);
        return;
      }

      // Clone styles and content
      const style = `
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          @media print {
            @page { size: auto; margin: 2mm; }
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bill - Table ${tableNumber}</title>
            ${style}
          </head>
          <body>
            ${printContentRef.current.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                // Close after print dialog closes (works in most browsers)
                setTimeout(() => window.close(), 1000);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      setShouldPrint(false);
    }
  }, [shouldPrint, tableNumber]);

  // 🔄 Custom submit handler
  const handleSubmitSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasPendingItems || isSending) return;

    setIsSending(true);
    const formData = new FormData(e.currentTarget);

    try {
      await sendOrdersToKitchen(formData);
      // ✅ After success, trigger print
      setShouldPrint(true);
    } catch (err) {
      console.error("Send failed:", err);
      alert("Failed to send order. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* ❗ Hidden div used ONLY for print content */}
      {shouldPrint && (
        <div style={{ display: "none" }} ref={printContentRef}>
          <CustomerBillPrint
            tableNumber={tableNumber}
            orders={allOrdersForBill}
            total={currentCheck.total}
          />
        </div>
      )}

      <div className="space-y-8">
        {/* SENT ORDERS */}
        {currentCheck.orders.filter((o: any) => o.status !== "PENDING").length >
          0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-90">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              Sent to Kitchen
            </h2>
            {currentCheck.orders
              .filter((o: any) => o.status !== "PENDING")
              .flatMap((order: any) =>
                order.items.map((item: any) => (
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
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded mt-1 inline-block">
                        SENT
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

        {/* CURRENT ORDER */}
        {pendingItems.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3 text-violet-600">
              Current Order
            </h2>
            {pendingItems.map((item: any) => (
              <div
                key={item.menuItem.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50 p-3 rounded mb-3"
              >
                <div className="font-medium flex-1">{item.menuItem.name}</div>
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
                  <span className="font-bold w-8 text-center">
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
                      placeholder="Special instructions..."
                      defaultValue={item.notes || ""}
                      className="w-full p-1.5 text-sm border rounded"
                      onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                    />
                  </form>
                </div>
              </div>
            ))}

            {/* SEND BUTTON */}
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
                {isSending ? "Sending..." : "✅ Send to Kitchen"}
              </button>
            </form>
          </div>
        )}

        {/* TOTAL */}
        <div className="border-t pt-4">
          <p className="text-lg font-bold text-gray-900">
            Total: ${currentCheck.total.toFixed(2)}
          </p>
        </div>

        {/* MENU */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Add Items</h2>
          <MenuFilterClient tableId={tableId} menuItems={menuItems} />
        </div>
      </div>
    </>
  );
}
