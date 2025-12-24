// app/(dashboard)/settings/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth } from "date-fns";
import { getReportData } from "./actions";
import Link from "next/link";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState(format(new Date(), "yyyy-MM-dd"));
  const [rangeType, setRangeType] = useState<"day" | "week" | "month" | "all">(
    "day"
  );
  const [categoryId, setCategoryId] = useState<string | "">("");
  const [page, setPage] = useState(1);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getReportData({
        dateRange,
        rangeType,
        page,
        categoryId,
      });
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, rangeType, page, categoryId]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(e.target.value);
    setRangeType("day");
  };

  const handleWeekChange = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    setDateRange(format(start, "yyyy-MM-dd"));
    setRangeType("week");
  };

  const handleMonthChange = () => {
    const today = new Date();
    setDateRange(format(today, "yyyy-MM"));
    setRangeType("month");
  };

  const handleAllChange = () => {
    setRangeType("all");
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando reportes...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-600">Reporte de Ventas</h1>
        <Link
          href="/settings"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a Ajustes
        </Link>
      </div>

      {/* Date Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Día
            </label>
            <input
              type="date"
              value={dateRange}
              onChange={handleDateChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleWeekChange}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              Esta semana
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleMonthChange}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              Este mes
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAllChange}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              Reporte general
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categorias
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Todas las Categorias</option>
              {reportData?.categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-green-800">Cash</h3>
          <p className="text-2xl font-bold mt-2">
            ${reportData?.sales.totalCash.toFixed(2)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-blue-800">Yape</h3>
          <p className="text-2xl font-bold mt-2">
            ${reportData?.sales.totalYape.toFixed(2)}
          </p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-violet-800">Total</h3>
          <p className="text-2xl font-bold mt-2">
            ${reportData?.sales.totalOverall.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ALL ITEMS SOLD */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Todos los items vendidos</h2>
          <p className="text-gray-600 text-sm">
            Total:{" "}
            {reportData?.itemsSold.reduce(
              (sum: number, item: any) => sum + item.totalQuantity,
              0
            ) || 0}{" "}
            items
          </p>
        </div>
        {reportData?.itemsSold.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Sin items vendidos en este periodo
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cantidad vendida
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.itemsSold.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.menuItem?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.menuItem?.category?.name || "Other"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.totalQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ALL ORDERS */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Todas las Órdenes</h2>
          <p className="text-gray-600 text-sm">
            Mostrando {reportData?.orders.length} de{" "}
            {reportData?.pagination.totalOrders || 0} órdenes
          </p>
        </div>
        {reportData?.orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Sin órdenes en este periodo
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reportData.orders.map((order: any, index: number) => {
              const tableNumbers = order.tableNumbers.join(", ") || "?";
              const orderTotal = order.items.reduce(
                (sum: number, item: any) =>
                  sum + item.priceAtOrder * item.quantity,
                0
              );

              return (
                // ✅ Add striped background
                <div
                  key={order.id}
                  className={`p-6 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Table {tableNumbers} •{" "}
                        {format(order.createdAt, "MMM d, HH:mm")}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      ${orderTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.menuItem.name} x{item.quantity}
                        </span>
                        <span>
                          ${(item.priceAtOrder * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION FOR ORDERS */}
        {reportData?.pagination.totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-200">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded ${
                page === 1
                  ? "bg-gray-200 text-gray-500"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Atras
            </button>
            <span className="text-sm text-gray-700">
              Página {page} de {reportData.pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPage(Math.min(reportData.pagination.totalPages, page + 1))
              }
              disabled={page === reportData.pagination.totalPages}
              className={`px-4 py-2 rounded ${
                page === reportData.pagination.totalPages
                  ? "bg-gray-200 text-gray-500"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
