// app/settings/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { format, parseISO, startOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { getReportData, type TurnReportData } from "./actions";
import Link from "next/link";
import * as XLSX from "xlsx";

const REPORT_TIMEZONE = "America/Lima";

function TurnSummary({
  turns,
  rangeType,
}: {
  turns: TurnReportData[];
  rangeType: string;
}) {
  if (turns.length === 0) return null;

  const totalVariance = turns.reduce((sum, t) => sum + (t.variance || 0), 0);
  const totalSales = turns.reduce(
    (sum, t) => sum + (t.salesSnapshot?.total || 0),
    0,
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Resumen por Turnos</h2>
        <p className="text-gray-600 text-sm">
          {rangeType === "day"
            ? "Turnos del día seleccionado"
            : `Turnos acumulados del periodo (${turns.length} turnos)`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Turno
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Inicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cierre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ventas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Varianza
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cerrado por
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Hora Cierre
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {turns.map((turn) => (
              <tr key={turn.name} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {turn.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  S/ {turn.start.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {turn.end !== null ? `S/ ${turn.end.toFixed(2)}` : "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {turn.salesSnapshot?.total != null
                    ? `S/ ${turn.salesSnapshot.total.toFixed(2)}`
                    : "—"}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    (turn.variance || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {(turn.variance || 0) >= 0 ? "+" : ""}
                  {(turn.variance || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {turn.closedByName || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {turn.closedAt
                    ? format(new Date(turn.closedAt), "HH:mm")
                    : "—"}
                </td>
              </tr>
            ))}
            {/* Totals Row */}
            <tr className="bg-gray-50 font-semibold">
              <td className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
              <td className="px-6 py-4 text-sm text-gray-900">
                S/ {turns.reduce((s, t) => s + t.start, 0).toFixed(2)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                S/ {turns.reduce((s, t) => s + (t.end || 0), 0).toFixed(2)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                S/ {totalSales.toFixed(2)}
              </td>
              <td
                className={`px-6 py-4 text-sm ${totalVariance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {totalVariance >= 0 ? "+" : ""}
                {totalVariance.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">—</td>
              <td className="px-6 py-4 text-sm text-gray-600">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState(() => {
    const limaNow = toZonedTime(new Date(), REPORT_TIMEZONE);
    return format(limaNow, "yyyy-MM-dd");
  });

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
    const limaNow = toZonedTime(new Date(), REPORT_TIMEZONE);
    const start = startOfWeek(limaNow, { weekStartsOn: 1 });
    setDateRange(format(start, "yyyy-MM-dd"));
    setRangeType("week");
  };

  const handleMonthChange = () => {
    const limaNow = toZonedTime(new Date(), REPORT_TIMEZONE);
    setDateRange(format(limaNow, "yyyy-MM"));
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

    const workbook = XLSX.utils.book_new();

    // ========================================================================
    // 1️⃣ MAIN REPORT SHEET
    // ========================================================================
    const mainData: any[][] = [];

    // Header
    const reportTitle =
      rangeType === "day"
        ? "Reporte Diario"
        : rangeType === "week"
          ? "Reporte Semanal"
          : rangeType === "month"
            ? "Reporte Mensual"
            : "Reporte General";
    mainData.push([`${reportTitle} - ${reportData.dateRange}`]);
    mainData.push([`Generado: ${new Date().toLocaleString("es-PE")}`]);
    mainData.push([]);

    // Sales Summary
    mainData.push(["RESUMEN DE VENTAS", ""]);
    mainData.push(["Concepto", "Monto (S/)"]);
    mainData.push(["Total Ventas Cash", reportData.sales.totalCash.toFixed(2)]);
    mainData.push(["Total Ventas Yape", reportData.sales.totalYape.toFixed(2)]);
    mainData.push(["Total General", reportData.sales.totalOverall.toFixed(2)]);
    mainData.push([]);

    // ✅ TURNS SUMMARY (Main Sheet)
    if (reportData.turns && reportData.turns.length > 0) {
      mainData.push(["RESUMEN POR TURNOS", ""]);
      mainData.push([
        "Turno",
        "Inicio (S/)",
        "Cierre (S/)",
        "Ventas (S/)",
        "Varianza (S/)",
        "Cerrado por",
        "Hora Cierre",
      ]);

      reportData.turns.forEach((turn: TurnReportData) => {
        mainData.push([
          turn.name,
          turn.start.toFixed(2),
          turn.end !== null ? turn.end.toFixed(2) : "—",
          turn.salesSnapshot?.total?.toFixed(2) || "—",
          turn.variance != null
            ? turn.variance >= 0
              ? `+${turn.variance.toFixed(2)}`
              : turn.variance.toFixed(2)
            : "—",
          turn.closedByName || "—",
          turn.closedAt ? format(new Date(turn.closedAt), "HH:mm") : "—",
        ]);
      });

      // Totals row
      const totals = reportData.turns.reduce(
        (acc: any, t: TurnReportData) => {
          acc.start += t.start;
          acc.end += t.end || 0;
          acc.sales += t.salesSnapshot?.total || 0;
          acc.variance += t.variance || 0;
          return acc;
        },
        { start: 0, end: 0, sales: 0, variance: 0 },
      );

      mainData.push([
        "TOTAL",
        totals.start.toFixed(2),
        totals.end.toFixed(2),
        totals.sales.toFixed(2),
        totals.variance >= 0
          ? `+${totals.variance.toFixed(2)}`
          : totals.variance.toFixed(2),
        "",
        "",
      ]);
      mainData.push([]);
    }

    // Items Sold
    if (reportData.itemsSold.length > 0) {
      mainData.push(["ÍTEMS VENDIDOS", ""]);
      mainData.push(["Ítem", "Categoría", "Cantidad Vendida"]);
      reportData.itemsSold.forEach((item: any) => {
        mainData.push([
          item.menuItem?.name || "Desconocido",
          item.menuItem?.category?.name || "Otro",
          item.totalQuantity,
        ]);
      });
      mainData.push([]);
    }

    // Checks Summary
    if (reportData.checks.length > 0) {
      mainData.push(["CUENTAS CERRADAS", ""]);
      mainData.push([
        "Mesa",
        "Fecha (Lima)",
        "Items",
        "Cantidad",
        "Método Pago",
        "Total (S/)",
      ]);
      reportData.checks.forEach((check: any) => {
        mainData.push([
          check.tableNames,
          check.closedAt,
          check.itemNames.join(", "),
          check.totalItemsQuantity,
          check.paymentMethods,
          check.total.toFixed(2),
        ]);
      });
      mainData.push([]);
    }

    // Final Totals
    mainData.push(["TOTALES FINALES", ""]);
    mainData.push([
      "Total Ítems Vendidos",
      reportData.itemsSold.reduce(
        (s: number, i: any) => s + i.totalQuantity,
        0,
      ),
    ]);
    mainData.push(["Total Cash", reportData.sales.totalCash.toFixed(2)]);
    mainData.push(["Total Yape", reportData.sales.totalYape.toFixed(2)]);
    mainData.push(["Total Gastos", reportData.spendings.total.toFixed(2)]);
    mainData.push(["Neto", reportData.spendings.netProfit.toFixed(2)]);
    mainData.push([
      "Margen",
      `${reportData.spendings.marginPercent.toFixed(2)}%`,
    ]);

    const mainSheet = XLSX.utils.aoa_to_sheet(mainData);

    // Column widths
    const maxCols = Math.max(...mainData.map((row) => row.length));
    mainSheet["!cols"] = Array.from({ length: maxCols }, (_, i) => {
      const maxWidth = Math.max(
        10,
        ...mainData.map((row) => (row[i] ? String(row[i]).length : 0)),
      );
      return { wch: Math.min(40, maxWidth + 2) };
    });

    // Bold headers
    const boldCells = new Set<string>();
    mainData.forEach((row, rowIndex) => {
      if (row.length === 0) return;
      if (row.length === 1 && typeof row[0] === "string") {
        boldCells.add(`A${rowIndex + 1}`);
        const headers = [
          "RESUMEN DE VENTAS",
          "RESUMEN POR TURNOS",
          "ÍTEMS VENDIDOS",
          "CUENTAS CERRADAS",
          "TOTALES FINALES",
        ];
        if (headers.includes(row[0]) && rowIndex + 1 < mainData.length) {
          for (let col = 0; col < mainData[rowIndex + 1].length; col++) {
            boldCells.add(`${String.fromCharCode(65 + col)}${rowIndex + 2}`);
          }
        }
      }
      if (
        row[0]?.toString().includes("Total") ||
        row[0] === "Neto" ||
        row[0] === "Margen"
      ) {
        boldCells.add(`A${rowIndex + 1}`);
        if (row[1] != null) boldCells.add(`B${rowIndex + 1}`);
      }
    });
    boldCells.forEach((cell) => {
      if (mainSheet[cell]) mainSheet[cell].s = { font: { bold: true } };
    });

    XLSX.utils.book_append_sheet(workbook, mainSheet, "Reporte");

    // ========================================================================
    // 2️⃣ DEDICATED "TURNOS" SHEET (Detailed)
    // ========================================================================
    if (reportData.turns && reportData.turns.length > 0) {
      const turnData: any[][] = [];
      turnData.push(["DESGLOSE DETALLADO POR TURNOS"]);
      turnData.push([`Periodo: ${reportData.dateRange} (${rangeType})`]);
      turnData.push([`Generado: ${new Date().toLocaleString("es-PE")}`]);
      turnData.push([]);

      turnData.push([
        "Turno",
        "Efectivo Inicial",
        "Efectivo Final",
        "Ventas Efectivo",
        "Ventas Yape",
        "Total Ventas",
        "Efectivo Esperado",
        "Varianza",
        "Cerrado por",
        "Fecha/Hora Cierre",
        "Notas",
      ]);

      reportData.turns.forEach((turn: TurnReportData) => {
        turnData.push([
          turn.name,
          turn.start.toFixed(2),
          turn.end !== null ? turn.end.toFixed(2) : "—",
          turn.salesSnapshot?.cash?.toFixed(2) || "—",
          turn.salesSnapshot?.yape?.toFixed(2) || "—",
          turn.salesSnapshot?.total?.toFixed(2) || "—",
          turn.expectedCash?.toFixed(2) || "—",
          turn.variance != null
            ? turn.variance >= 0
              ? `+${turn.variance.toFixed(2)}`
              : turn.variance.toFixed(2)
            : "—",
          turn.closedByName || "—",
          turn.closedAt ? new Date(turn.closedAt).toLocaleString("es-PE") : "—",
          turn.note || "—",
        ]);
      });

      // Summary totals
      turnData.push([]);
      turnData.push(["TOTALES ACUMULADOS"]);
      const totals = reportData.turns.reduce(
        (acc: any, t: TurnReportData) => {
          acc.start += t.start;
          acc.end += t.end || 0;
          acc.cash += t.salesSnapshot?.cash || 0;
          acc.yape += t.salesSnapshot?.yape || 0;
          acc.total += t.salesSnapshot?.total || 0;
          acc.expected += t.expectedCash || 0;
          acc.variance += t.variance || 0;
          return acc;
        },
        {
          start: 0,
          end: 0,
          cash: 0,
          yape: 0,
          total: 0,
          expected: 0,
          variance: 0,
        },
      );

      turnData.push([
        "",
        totals.start.toFixed(2),
        totals.end.toFixed(2),
        totals.cash.toFixed(2),
        totals.yape.toFixed(2),
        totals.total.toFixed(2),
        totals.expected.toFixed(2),
        totals.variance >= 0
          ? `+${totals.variance.toFixed(2)}`
          : totals.variance.toFixed(2),
        "",
        "",
        "",
      ]);

      const turnSheet = XLSX.utils.aoa_to_sheet(turnData);
      turnSheet["!cols"] = [
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 12 },
        { wch: 20 },
        { wch: 22 },
        { wch: 30 },
      ];

      // Bold header
      for (let col = 0; col < 11; col++) {
        const ref = `${String.fromCharCode(65 + col)}4`;
        if (turnSheet[ref]) turnSheet[ref].s = { font: { bold: true } };
      }

      XLSX.utils.book_append_sheet(workbook, turnSheet, "Turnos");
    }

    // ========================================================================
    // 3️⃣ SAVE FILE
    // ========================================================================
    const fileDate = reportData.dateRange.replace(/[-/:]/g, "");
    XLSX.writeFile(workbook, `Reporte_${rangeType}_${fileDate}.xlsx`);
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
          ← Ajustes
        </Link>
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium flex items-center gap-1"
        >
          📊 Exportar Excel
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
              max={format(
                toZonedTime(new Date(), REPORT_TIMEZONE),
                "yyyy-MM-dd",
              )}
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
              <option value="">Todas</option>
              {reportData?.categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          🕐 Todas las fechas en hora Perú (UTC-5)
        </p>
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

      {/* ✅ TURNS SECTION */}
      {reportData?.turns && reportData.turns.length > 0 && (
        <TurnSummary turns={reportData.turns} rangeType={rangeType} />
      )}

      {/* Items Sold */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Ítems Vendidos</h2>
          <p className="text-gray-600 text-sm">
            Total:{" "}
            {reportData?.itemsSold.reduce(
              (s: number, i: any) => s + i.totalQuantity,
              0,
            ) || 0}{" "}
            items
          </p>
        </div>
        {reportData?.itemsSold.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Sin items en este periodo
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
                    Cantidad
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.itemsSold.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.menuItem?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.menuItem?.category?.name || "Other"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.totalQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Checks Table */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Cuentas Cerradas</h2>
          <p className="text-gray-600 text-sm">
            {reportData?.checks.length} de{" "}
            {reportData?.pagination.totalChecks || 0} cuentas
          </p>
        </div>
        {reportData?.checks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Sin cuentas en este periodo
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mesa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha (Lima)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.checks.map((check: any, index: number) => (
                    <tr
                      key={check.id}
                      className={`hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {check.tableNames || "?"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {check.closedAt}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {check.itemNames.join(", ") || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {check.totalItemsQuantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {check.paymentMethods || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        S/ {check.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reportData?.pagination.totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t border-gray-200">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded ${page === 1 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  Atrás
                </button>
                <span className="text-sm text-gray-700">
                  Página {page} de {reportData.pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage(
                      Math.min(reportData.pagination.totalPages, page + 1),
                    )
                  }
                  disabled={page === reportData.pagination.totalPages}
                  className={`px-4 py-2 rounded ${page === reportData.pagination.totalPages ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
