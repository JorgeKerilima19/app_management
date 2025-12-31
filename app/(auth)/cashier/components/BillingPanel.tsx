// app/(auth)/cashier/components/BillingPanel.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  closeCheckAction,
  voidOrderItem,
  voidOrder,
  canPayCheck,
} from "../actions";
import { SplitPayment } from "./SplitPayment";
import { CustomerBillPrint } from "../CustomerBillPrint";
import { mergeTablesAction } from "../actions"; 

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
      setError("Razón es requerida (mínimo 3 caracteres)");
      return;
    }
    if (quantity < 1 || quantity > item.quantity) {
      setError("Cantidad inválida");
      return;
    }
    onConfirm(quantity, reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="font-bold text-lg mb-2">
          Anular item: {item.menuItem.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Cantidad actual: {item.quantity}
        </p>
        {item.quantity > 1 && (
          <div className="mb-3">
            <label className="block text-sm mb-1">Cantidad a anular</label>
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
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
          </div>
        )}
        <label className="block text-sm mb-1">Razón (obligatorio):</label>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
          className="w-full p-2 border border-gray-300 rounded text-black"
          rows={2}
          placeholder="e.g., Pedido incorrecto, solicitud del cliente..."
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
            Anular Item
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
      setError("Razón es requerida (mínimo 3 caracteres)");
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="font-bold text-lg mb-2">Anular toda la orden</h3>
        <p className="text-sm text-gray-600 mb-3">
          Mesa {tableNumber} se liberará. Esto no se puede deshacer
        </p>
        <label className="block text-sm mb-1">Razón (obligatorio):</label>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
          className="w-full p-2 border border-gray-300 rounded text-black"
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
            Anular orden
          </button>
        </div>
      </div>
    </div>
  );
}

function groupItemsByCategory(items: any[]) {
  const categories = Array.from(
    new Set(items.map((item) => item.menuItem.category?.name || "Otros"))
  ).sort();
  return categories.map((cat) => ({
    name: cat,
    items: items.filter(
      (item) => (item.menuItem.category?.name || "Otros") === cat
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
  const [canPay, setCanPay] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  // ✅ useEffect MOVED TO THE TOP - BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    if (selectedTable?.currentCheck?.id) {
      const checkPaymentStatus = async () => {
        const status = await canPayCheck(selectedTable.currentCheck.id);
        setCanPay(status);
      };
      checkPaymentStatus();
    }
  }, [selectedTable?.currentCheck?.id]);

  // ✅ CONDITIONAL RETURN NOW HAPPENS AFTER ALL HOOKS
  if (!selectedTableId || !selectedTable?.currentCheck) {
    return (
      <div className="w-96 bg-white shadow-lg p-6 text-center text-gray-500">
        Selecciona una mesa para ver su orden
      </div>
    );
  }

  // ✅ REST OF THE COMPONENT LOGIC
  const check = selectedTable.currentCheck;
  const allItems = check.orders.flatMap((o: any) => o.items);
  const groupedItems = groupItemsByCategory(allItems);
  const capacity = selectedTable.capacity; // Use table capacity

  const handlePrint = () => {
    if (!printRef.current || !check || !selectedTable) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor permita ventanas emergentes para imprimir.");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPay) return;
    if (!confirm(`Confirmar pago de S/${check.total.toFixed(2)}?`)) return;

    const cashNum = parseFloat(cashAmount) || 0;
    const yapeNum = parseFloat(yapeAmount) || 0;
    const totalPaid =
      paymentMethod === "CASH"
        ? cashNum
        : paymentMethod === "MOBILE_PAY"
        ? yapeNum
        : cashNum + yapeNum;

    if (Math.abs(totalPaid - check.total) > 0.01) {
      alert("Los montos no coinciden con el total");
      return;
    }

    const formData = new FormData();
    formData.set("checkId", check.id);
    formData.set("paymentMethod", paymentMethod);
    formData.set("cashAmount", cashNum.toString());
    formData.set("yapeAmount", yapeNum.toString());

    await closeCheckAction(formData);
    onDismiss();
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

  const cashNum = parseFloat(cashAmount) || 0;
  const yapeNum = parseFloat(yapeAmount) || 0;
  const totalPaid =
    paymentMethod === "CASH"
      ? cashNum
      : paymentMethod === "MOBILE_PAY"
      ? yapeNum
      : cashNum + yapeNum;
  const isTotalMatching = Math.abs(totalPaid - check.total) < 0.01;

  return (
    <>
      {/* Hidden print content */}
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
          <h2 className="text-xl font-bold text-violet-600">
            Mesa {selectedTable.number} ({selectedTable.name || ""})
          </h2>
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {!canPay && (
          <div className="bg-amber-100 border border-amber-300 text-amber-800 p-3 rounded mb-4 text-sm">
            ⚠️ No se puede pagar hasta que todos los items estén{" "}
            <strong>servidos</strong>
          </div>
        )}

        <button
          onClick={handlePrint}
          className="w-full py-2 mb-4 bg-violet-600 text-white rounded font-medium hover:bg-violet-700"
        >
          🖨️ Imprimir cuenta
        </button>

        {/* Order items */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-800">Órden</h3>
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
                    <span className="text-gray-800">
                      S/ {(item.priceAtOrder * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => setShowVoidItemModal(item)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ❌ Anular
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="text-lg font-bold mb-6 text-right text-gray-900">
          Total: S/ {check.total.toFixed(2)}
        </div>

        <button
          onClick={() => setIsSplitMode(!isSplitMode)}
          className="w-full py-2 mb-6 bg-violet-100 text-violet-800 rounded font-medium"
        >
          {isSplitMode ? "Cerrar separación" : "Separar por persona"}
        </button>

        {isSplitMode && (
          <SplitPayment
            tableCapacity={capacity}
            items={allItems}
            total={check.total}
          />
        )}

        {canPay && (
          <>
            <div className="mb-4">
              <label className="block font-medium mb-2 text-gray-800">
                Método de pago
              </label>
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
                      : method === "CASH"
                      ? "Efectivo"
                      : "Mixto"}
                  </label>
                ))}
              </div>
            </div>

            {(paymentMethod === "CASH" || paymentMethod === "MIXED") && (
              <div className="mb-3">
                <label className="block text-sm mb-1 text-gray-700">
                  Monto en efectivo
                </label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-black"
                  step="0.01"
                />
              </div>
            )}

            {(paymentMethod === "MOBILE_PAY" || paymentMethod === "MIXED") && (
              <div className="mb-6">
                <label className="block text-sm mb-1 text-gray-700">
                  Monto en Yape
                </label>
                <input
                  type="number"
                  value={yapeAmount}
                  onChange={(e) => setYapeAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-black"
                  step="0.01"
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isTotalMatching}
              className={`w-full py-3 rounded font-bold ${
                !isTotalMatching
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              Confirmar Pago
            </button>
          </>
        )}

        <div className="mt-4">
          <button
            onClick={() => setShowVoidOrderModal(true)}
            className="w-full py-2 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200"
          >
            🚫 Anular orden entera
          </button>
        </div>
      </div>
    </>
  );
}
