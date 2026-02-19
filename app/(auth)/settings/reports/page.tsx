// app/settings/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { getReportData } from "./actions";
import Link from "next/link";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState(format(new Date(), "yyyy-MM-dd"));
  const [rangeType, setRangeType] = useState<"day" | "week" | "month" | "all">(
    "day",
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
    const start = new Date(today);
    start.setDate(
      today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1),
    );
    start.setHours(0, 0, 0, 0);
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

  const exportToExcel = () => {
    if (!reportData) return;

    const worksheetData: any[][] = [];

    // --- Title ---
    let title = "Reporte de Ventas";
    let filename = "Reporte_Ventas";

    if (rangeType === "day") {
      title = `Reporte Diario - ${reportData.dateRange}`;
      filename = `Reporte_Diario_${reportData.dateRange.replace(/\//g, "-")}`;
    } else if (rangeType === "week") {
      title = `Reporte Semanal - ${reportData.dateRange}`;
      filename = `Reporte_Semanal_${reportData.dateRange.replace(/\//g, "-")}`;
    } else if (rangeType === "month") {
      title = `Reporte Mensual - ${reportData.dateRange}`;
      filename = `Reporte_Mensual_${reportData.dateRange.replace(/-/g, "_")}`;
    } else {
      title = "Reporte General";
      filename = "Reporte_General";
    }

    worksheetData.push([title]);
    worksheetData.push([]); // Empty row

    // --- Sales Summary ---
    worksheetData.push(["RESUMEN DE VENTAS"]);
    worksheetData.push(["Concepto", "Monto (S/)"]);
    worksheetData.push(["Total Ventas Cash", reportData.sales.totalCash]);
    worksheetData.push(["Total Ventas Yape", reportData.sales.totalYape]);
    worksheetData.push(["Total General", reportData.sales.totalOverall]);
    worksheetData.push([]); // Empty row

    // --- Items Sold ---
    worksheetData.push(["ÍTEMS VENDIDOS"]);
    worksheetData.push(["Ítem", "Categoría", "Cantidad Vendida"]);

    reportData.itemsSold.forEach((item: any) => {
      worksheetData.push([
        item.menuItem?.name || "Desconocido",
        item.menuItem?.category?.name || "Otro",
        item.totalQuantity,
      ]);
    });
    worksheetData.push([]); // Empty row

    // --- Checks Summary ---
    if (reportData.checks.length > 0) {
      worksheetData.push(["CUENTAS CERRADAS"]);
      worksheetData.push([
        "Mesa",
        "Fecha",
        "Items",
        "Cantidad",
        "Método Pago",
        "Total (S/)",
      ]);

      reportData.checks.forEach((check: any) => {
        worksheetData.push([
          check.tableNames,
          check.closedAt,
          check.itemNames.join(", "),
          check.totalItemsQuantity,
          check.paymentMethods,
          check.total,
        ]);
      });
    }

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-width columns
    const colWidths =
      worksheetData[0]?.map((_, i) => {
        const maxWidth = Math.max(
          ...worksheetData.map((row) => (row[i] ? String(row[i]).length : 0)),
        );
        return { wch: Math.min(30, Math.max(10, maxWidth + 2)) };
      }) || [];

    worksheet["!cols"] = colWidths;

    // ✅ Apply bold formatting to headers
    const boldCells = new Set<string>();

    // Find and bold main title
    boldCells.add("A1");

    // Bold section headers and column headers
    let rowIndex = 0;
    while (rowIndex < worksheetData.length) {
      const row = worksheetData[rowIndex];

      if (row.length === 0) {
        rowIndex++;
        continue;
      }

      // Bold section headers (single column rows)
      if (row.length === 1 && typeof row[0] === "string") {
        boldCells.add(`A${rowIndex + 1}`);

        // If this is a data section header, bold the next row (column headers)
        const sectionHeaders = [
          "RESUMEN DE VENTAS",
          "ÍTEMS VENDIDOS",
          "CUENTAS CERRADAS",
        ];
        if (
          sectionHeaders.includes(row[0]) &&
          rowIndex + 1 < worksheetData.length
        ) {
          const nextRow = worksheetData[rowIndex + 1];
          for (let colIndex = 0; colIndex < nextRow.length; colIndex++) {
            const colLetter = String.fromCharCode(65 + colIndex);
            boldCells.add(`${colLetter}${rowIndex + 2}`);
          }
        }
      }

      rowIndex++;
    }

    // Apply bold formatting safely
    boldCells.forEach((cellRef) => {
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = { font: { bold: true } };
      }
    });

    // Create and download workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return (
    <div className="space-y-8">
      {/* Daily Summary Card */}
      {rangeType === "day" && reportData?.dailySummary && (
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Resumen Diario</h2>
            <p className="text-gray-600 text-sm">Apertura y cierre del día</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <h3 className="text-lg font-bold text-blue-800">Apertura</h3>
                <p className="text-2xl font-bold mt-2 text-gray-900">
                  S/ {reportData.dailySummary.startingCash.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <h3 className="text-lg font-bold text-green-800">
                  Ventas Cash
                </h3>
                <p className="text-2xl font-bold mt-2 text-gray-900">
                  S/ {reportData.sales.totalCash.toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
                <h3 className="text-lg font-bold text-purple-800">
                  Ventas Yape
                </h3>
                <p className="text-2xl font-bold mt-2 text-gray-900">
                  S/ {reportData.sales.totalYape.toFixed(2)}
                </p>
              </div>
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-6 text-center">
                <h3 className="text-lg font-bold text-violet-800">Cierre</h3>
                <p className="text-2xl font-bold mt-2 text-gray-900">
                  S/ {reportData.dailySummary.endingCash.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-600">
          Reporte de Ventas
        </h1>
        <Link
          href="/settings"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a Ajustes
        </Link>
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium flex items-center gap-1"
        >
          <span>📊</span> Exportar a Excel
        </button>
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
              className="w-full p-2 border border-gray-300 rounded text-black bg-white"
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
              Categorías
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white"
            >
              <option value="">Todas las Categorías</option>
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
          <h3 className="text-lg font-bold text-green-800">Efectivo</h3>
          <p className="text-2xl font-bold mt-2 text-gray-900">
            S/ {reportData?.sales.totalCash.toFixed(2)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-blue-800">Yape</h3>
          <p className="text-2xl font-bold mt-2 text-gray-900">
            S/ {reportData?.sales.totalYape.toFixed(2)}
          </p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-violet-800">Total</h3>
          <p className="text-2xl font-bold mt-2 text-gray-900">
            S/ {reportData?.sales.totalOverall.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ALL ITEMS SOLD */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Todos los items vendidos
          </h2>
          <p className="text-gray-600 text-sm">
            Total:{" "}
            {reportData?.itemsSold.reduce(
              (sum: number, item: any) => sum + item.totalQuantity,
              0,
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad vendida
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.itemsSold.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.menuItem?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.menuItem?.category?.name || "Other"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.totalQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CHECK SUMMARY TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Resumen de Cuentas Cerradas
          </h2>
          <p className="text-gray-600 text-sm">
            Mostrando {reportData?.checks.length} de{" "}
            {reportData?.pagination.totalChecks || 0} cuentas cerradas
          </p>
        </div>
        {reportData?.checks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Sin cuentas cerradas en este periodo
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items Vendidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método de Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.checks.map((check: any, index: number) => (
                  <tr
                    key={check.id}
                    className={`hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {check.tableNames || "?"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {check.closedAt}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {check.itemNames.join(", ") || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {check.totalItemsQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {check.paymentMethods || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      S/ {check.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOR CHECKS */}
        {reportData?.pagination.totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-200">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded ${
                page === 1
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Atrás
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
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
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
