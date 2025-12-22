// app/(dashboard)/cashier/components/BillingPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { closeCheckAction } from "../actions";
import { SplitPayment } from "./SplitPayment";

export function BillingPanel({
  tables,
  selectedTableId,
  onDismiss,
}: {
  tables: any[];
  selectedTableId: string | null;
  onDismiss: () => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "MOBILE_PAY" | "MIXED"
  >("CASH");
  const [cashAmount, setCashAmount] = useState("");
  const [yapeAmount, setYapeAmount] = useState("");
  const [isSplitMode, setIsSplitMode] = useState(false);

  useEffect(() => {
    setIsSplitMode(false);
    setCashAmount("");
    setYapeAmount("");
  }, [selectedTableId]);

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const check = selectedTable?.currentCheck;

  const cashNum = parseFloat(cashAmount) || 0;
  const yapeNum = parseFloat(yapeAmount) || 0;
  const totalPaid =
    paymentMethod === "CASH"
      ? cashNum
      : paymentMethod === "MOBILE_PAY"
      ? yapeNum
      : cashNum + yapeNum;

  const isTotalMatching = check && Math.abs(totalPaid - check.total) < 0.01;
  const isConfirmDisabled = !check || !isTotalMatching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmDisabled || !check) return;

    if (!confirm(`Confirm payment of $${check.total.toFixed(2)}?`)) return;

    const formData = new FormData();
    formData.set("checkId", check.id);
    formData.set("paymentMethod", paymentMethod);
    formData.set("cashAmount", cashNum.toString());
    formData.set("yapeAmount", yapeNum.toString());

    await closeCheckAction(formData);
    onDismiss();
  };

  if (!selectedTableId || !check) {
    return (
      <div className="w-96 bg-white shadow-lg p-6 text-center text-gray-500">
        Select a table to bill
      </div>
    );
  }

  // Derive capacity: 11-15 = 6-seaters, else 4
  const capacity =
    selectedTable.number >= 11 && selectedTable.number <= 15 ? 6 : 4;
  

  return (
    <div className="w-96 bg-white shadow-lg p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Table {selectedTable.number}</h2>
        <button
          onClick={onDismiss}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Order</h3>
        {check.orders.flatMap((order: any) =>
          order.items.map((item: any) => (
            <div
              key={item.id}
              className="flex justify-between text-sm py-1 border-b"
            >
              <span>
                {item.menuItem.name} x{item.quantity}
              </span>
              <span>${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
            </div>
          ))
        )}
      </div>

      <div className="text-lg font-bold mb-6 text-right">
        Total: ${check.total.toFixed(2)}
      </div>

      <button
        onClick={() => setIsSplitMode(!isSplitMode)}
        className="w-full py-2 mb-6 bg-violet-100 text-violet-800 rounded font-medium"
      >
        {isSplitMode ? "Close Split" : "Split Payment"}
      </button>

      {isSplitMode && (
        <SplitPayment
          tableCapacity={capacity}
          items={check.orders.flatMap((o: any) => o.items)}
          total={check.total}
        />
      )}

      <div className="mb-4">
        <label className="block font-medium mb-2">Payment Method</label>
        <div className="space-y-2">
          {(["CASH", "MOBILE_PAY", "MIXED"] as const).map((method) => (
            <label key={method} className="flex items-center">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                className="mr-2"
              />
              {method === "MOBILE_PAY"
                ? "Yape"
                : method.charAt(0) + method.slice(1).toLowerCase()}
            </label>
          ))}
        </div>
      </div>

      {(paymentMethod === "CASH" || paymentMethod === "MIXED") && (
        <div className="mb-3">
          <label className="block text-sm mb-1">Cash Amount</label>
          <input
            type="number"
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            className="w-full p-2 border rounded"
            step="0.01"
          />
        </div>
      )}

      {(paymentMethod === "MOBILE_PAY" || paymentMethod === "MIXED") && (
        <div className="mb-6">
          <label className="block text-sm mb-1">Yape Amount</label>
          <input
            type="number"
            value={yapeAmount}
            onChange={(e) => setYapeAmount(e.target.value)}
            className="w-full p-2 border rounded"
            step="0.01"
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isConfirmDisabled}
        className={`w-full py-3 rounded font-bold ${
          isConfirmDisabled
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        Confirm Payment
      </button>
    </div>
  );
}
