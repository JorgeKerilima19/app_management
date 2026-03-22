// app/dashboard/PaymentSummary.tsx
"use client";

interface PaymentSummaryProps {
  payments: {
    totalCash: number;
    totalYape: number;
    totalOverall: number;
    cashPercentage: number;
    yapePercentage: number;
  };
  spendings: {
    total: number;
    netProfit: number;
    marginPercent: number;
  };
}

export function PaymentSummary({ payments, spendings }: PaymentSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Cash */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <h3 className="text-lg font-bold text-green-800">Efectivo</h3>
        <p className="text-2xl font-bold mt-2 text-gray-900">
          S/ {payments.totalCash.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          ({payments.cashPercentage.toFixed(1)}%)
        </p>
      </div>

      {/* Yape */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <h3 className="text-lg font-bold text-blue-800">Yape</h3>
        <p className="text-2xl font-bold mt-2 text-gray-900">
          S/ {payments.totalYape.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          ({payments.yapePercentage.toFixed(1)}%)
        </p>
      </div>

      {/* Spendings */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
        <h3 className="text-lg font-bold text-orange-800">Gastos</h3>
        <p className="text-2xl font-bold mt-2 text-gray-900">
          S/ {spendings.total.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">Compras + Mermas</p>
      </div>

      {/* Net */}
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-center">
        <h3 className="text-lg font-bold text-violet-800">Neto</h3>
        <p
          className={`text-2xl font-bold mt-2 ${
            spendings.netProfit >= 0 ? "text-green-700" : "text-red-700"
          }`}
        >
          S/ {spendings.netProfit.toFixed(2)}
        </p>

        <div className="mt-3 pt-3 border-t border-violet-200 space-y-1">
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">Ventas:</span>
            <span className="font-medium text-gray-900">
              S/ {payments.totalOverall.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">Gastos:</span>
            <span className="font-medium text-orange-700">
              - S/ {spendings.total.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-gray-700">Ganancia:</span>
            <span
              className={`${
                spendings.netProfit >= 0 ? "text-green-700" : "text-red-700"
              }`}
            >
              S/ {spendings.netProfit.toFixed(2)}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-3 pt-2 border-t border-violet-200">
          ({spendings.marginPercent.toFixed(1)}% margen)
        </p>
      </div>
    </div>
  );
}
