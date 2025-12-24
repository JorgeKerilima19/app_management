// app/(dashboard)/billing/components/BillingPanel.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { closeCheckAction, voidOrderItem, voidOrder } from "../actions";
import { SplitPayment } from "./SplitPayment";
import { CustomerBillPrint } from "./CustomerBillPrint";

function VoidItemModal({
  item,
  onConfirm,
  onCancel,
}: {
  item: any;
  onConfirm: (quantity: number, reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [quantity, setQuantity] = useState(item.quantity);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) {
      setError("Please provide a reason (at least 3 characters)");
      return;
    }
    if (quantity < 1 || quantity > item.quantity) {
      setError("Invalid quantity");
      return;
    }
    onConfirm(quantity, reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-[#0000003a] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="font-bold text-lg mb-2">
          Cancelar item: {item.menuItem.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Cantidad actual: {item.quantity}
        </p>
        {item.quantity > 1 && (
          <div className="mb-3">
            <label className="block text-sm mb-1">Cuantos a cancelar</label>
            <input
              type="number"
              min="1"
              max={item.quantity}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.min(
                    item.quantity,
                    Math.max(1, parseInt(e.target.value) || 1)
                  )
                )
              }
              className="w-full p-2 border rounded"
            />
          </div>
        )}
        <label className="block text-sm mb-1">Motivo (obligatorio):</label>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
          className="w-full p-2 border rounded mb-2"
          rows={2}
          placeholder="e.g., Wrong item, Customer request..."
          autoFocus
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 bg-gray-200 rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 py-2 bg-red-600 text-white rounded"
          >
            Cancelar Item
          </button>
        </div>
      </div>
    </div>
  );
}

function VoidOrderModal({
  tableNumber,
  onConfirm,
  onCancel,
}: {
  tableNumber: number;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) {
      setError("Please provide a reason (at least 3 characters)");
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-[#0000003a] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="font-bold text-lg mb-2">Cancelar todo el pedido</h3>
        <p className="text-sm text-gray-600 mb-3">
          Mesa {tableNumber} se liberará. Esto no se puede deshacer
        </p>
        <label className="block text-sm mb-1">Motivo (Obligatorio):</label>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
          className="w-full p-2 border rounded mb-2"
          rows={3}
          placeholder="ejm., Eran invitados"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 bg-gray-200 rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 py-2 bg-red-700 text-white rounded"
          >
            Cancelar pedido
          </button>
        </div>
      </div>
    </div>
  );
}

function groupItemsByCategory(items: any[]) {
  const categories = Array.from(
    new Set(items.map((item) => item.menuItem.category?.name || "Other"))
  ).sort();
  return categories.map((cat) => ({
    name: cat,
    items: items.filter(
      (item) => (item.menuItem.category?.name || "Other") === cat
    ),
  }));
}

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
  const [showVoidItemModal, setShowVoidItemModal] = useState<any>(null);
  const [showVoidOrderModal, setShowVoidOrderModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSplitMode(false);
    setCashAmount("");
    setYapeAmount("");
  }, [selectedTableId]);

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  if (!selectedTableId || !selectedTable?.currentCheck) {
    return (
      <div className="w-96 bg-white shadow-lg p-6 text-center text-gray-500">
        Selecciona la mesa a cobrar
      </div>
    );
  }

  const check = selectedTable.currentCheck;
  const capacity =
    selectedTable.number >= 11 && selectedTable.number <= 15 ? 6 : 4;
  const allItems = check.orders.flatMap((o: any) => o.items);
  const groupedItems = groupItemsByCategory(allItems);

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

  // ✅ PRINT HANDLER — EXACT SAME AS tables/[id]
  const handlePrint = () => {
    if (!printRef.current || !check || !selectedTable) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cuenta - Mesa ${selectedTable.number}</title>
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleVoidItem = async (quantity: number, reason: string) => {
    if (!showVoidItemModal) return;
    const formData = new FormData();
    formData.set("orderItemId", showVoidItemModal.id);
    formData.set("voidQuantity", quantity.toString());
    formData.set("reason", reason);
    await voidOrderItem(formData);
    setShowVoidItemModal(null);
  };

  const handleVoidOrder = async (reason: string) => {
    const formData = new FormData();
    formData.set("checkId", check.id);
    formData.set("reason", reason);
    await voidOrder(formData);
    onDismiss();
  };

  return (
    <>
      {/* ✅ HIDDEN PRINT CONTENT — MUST BE IN MAIN DOCUMENT */}
      <div style={{ display: "none" }} ref={printRef}>
        <CustomerBillPrint
          tableNumber={selectedTable.number}
          orders={check.orders}
          total={check.total}
        />
      </div>

      {showVoidItemModal && (
        <VoidItemModal
          item={showVoidItemModal}
          onConfirm={handleVoidItem}
          onCancel={() => setShowVoidItemModal(null)}
        />
      )}
      {showVoidOrderModal && (
        <VoidOrderModal
          tableNumber={selectedTable.number}
          onConfirm={handleVoidOrder}
          onCancel={() => setShowVoidOrderModal(false)}
        />
      )}

      <div className="w-96 bg-white shadow-lg p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Mesa {selectedTable.number}</h2>
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="w-full py-2 mb-4 bg-violet-600 text-white rounded font-medium hover:bg-violet-700"
        >
          🖨️ Imprimir cuenta
        </button>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Órden</h3>
          {groupedItems.map((group) => (
            <div key={group.name} className="mb-3">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                {group.name}
              </div>
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-sm py-1 border-b border-gray-100"
                >
                  <span>
                    {item.menuItem.name} x{item.quantity}
                    {item.notes && (
                      <span className="text-xs italic"> — "{item.notes}"</span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <span>
                      ${(item.priceAtOrder * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => setShowVoidItemModal(item)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="text-lg font-bold mb-6 text-right">
          Total: ${check.total.toFixed(2)}
        </div>

        <button
          onClick={() => setIsSplitMode(!isSplitMode)}
          className="w-full py-2 mb-6 bg-violet-100 text-violet-800 rounded font-medium"
        >
          {isSplitMode ? "Cerrar separación" : "Separar por pedido"}
        </button>

        {isSplitMode && (
          <SplitPayment
            tableCapacity={capacity}
            items={allItems}
            total={check.total}
          />
        )}

        <div className="mb-4">
          <label className="block font-medium mb-2">Método de pago</label>
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
            <label className="block text-sm mb-1">Monto Cash</label>
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
            <label className="block text-sm mb-1">Monto Yape</label>
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
          Confirmar Pago
        </button>

        <div className="mt-4">
          <button
            onClick={() => setShowVoidOrderModal(true)}
            className="w-full py-2 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200"
          >
            🚫 Cancelar órden entera
          </button>
        </div>
      </div>
    </>
  );
}
