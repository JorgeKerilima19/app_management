// app/(auth)/dashboard/close/components/FinancialSummary.tsx
type Props = {
  dailySummary: {
    startingCash: number;
    endingCash: number;
    status: "OPEN" | "CLOSED";
  };
  sales: { totalCash: number; totalYape: number; totalOverall: number };
  spendings: { total: number; netProfit: number; marginPercent: number };
};

export function FinancialSummary({ dailySummary, sales, spendings }: Props) {
  const netProfit = spendings.netProfit;
  const marginPercent = spendings.marginPercent;

  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-600 p-4 md:p-6">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">
        Resumen Financiero
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Apertura */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <h3 className="text-lg font-bold text-blue-800">Apertura</h3>
          <p className="text-xl md:text-2xl font-bold mt-2 text-gray-900">
            S/ {dailySummary.startingCash.toFixed(2)}
          </p>
        </div>
        {/* Ventas Cash */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <h3 className="text-lg font-bold text-green-800">Ventas Cash</h3>
          <p className="text-xl md:text-2xl font-bold mt-2 text-gray-900">
            S/ {sales.totalCash.toFixed(2)}
          </p>
        </div>
        {/* Ventas Yape */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <h3 className="text-lg font-bold text-purple-800">Ventas Yape</h3>
          <p className="text-xl md:text-2xl font-bold mt-2 text-gray-900">
            S/ {sales.totalYape.toFixed(2)}
          </p>
        </div>
        {/* Neto */}
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-center">
          <h3 className="text-lg font-bold text-violet-800">Neto</h3>
          <p
            className={`text-xl md:text-2xl font-bold mt-2 ${netProfit >= 0 ? "text-green-700" : "text-red-700"}`}
          >
            S/ {netProfit.toFixed(2)}
          </p>
          <div className="mt-3 pt-3 border-t border-violet-200 space-y-1">
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">Ventas:</span>
              <span className="font-medium text-gray-900">
                S/ {sales.totalOverall.toFixed(2)}
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
                className={netProfit >= 0 ? "text-green-700" : "text-red-700"}
              >
                S/ {netProfit.toFixed(2)}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3 pt-2 border-t border-violet-200">
            ({marginPercent.toFixed(1)}% margen)
          </p>
        </div>
      </div>
      {dailySummary.status === "CLOSED" && (
        <div className="mt-4 text-center">
          <p className="text-xl font-bold text-violet-400">
            Cierre Final: S/ {dailySummary.endingCash.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
