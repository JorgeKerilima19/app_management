// lib/excelExport.ts
import * as XLSX from "xlsx";
import type { ClosingData } from "@/app/(auth)/dashboard/close/CloseClient";

export function exportClosingReportToExcel(data: ClosingData) {
  const workbook = XLSX.utils.book_new();

  // 1. Main Report Sheet
  const mainData: any[][] = [];
  mainData.push([
    "REPORTE DE CIERRE DIARIO",
    `Fecha: ${data.date.toLocaleDateString("es-PE")}`,
  ]);
  mainData.push([]);

  // Financial Summary
  mainData.push(["RESUMEN FINANCIERO", ""]);
  mainData.push(["Concepto", "Monto (S/)"]);
  mainData.push(["Apertura", data.dailySummary?.startingCash ?? 0]);
  mainData.push(["Ventas Cash", data.sales.totalCash]);
  mainData.push(["Ventas Yape", data.sales.totalYape]);
  mainData.push(["Total Ventas", data.sales.totalOverall]);
  mainData.push(["Gastos (Compras + Mermas)", data.spendings.total]);
  mainData.push(["Neto del Día", data.spendings.netProfit]);
  mainData.push([`Margen (%)`, `${data.spendings.marginPercent.toFixed(2)}%`]);
  mainData.push([]);

  // Items Sold
  mainData.push(["ÍTEMS VENDIDOS"]);
  mainData.push([
    "Ítem",
    "Categoría",
    "Cantidad",
    "Precio Unitario (S/)",
    "Total (S/)",
  ]);
  data.itemsSold.forEach((item: any) => {
    if (item.menuItem) {
      mainData.push([
        item.menuItem.name,
        item.menuItem.category?.name || "Otro",
        item.totalQuantity,
        item.menuItem.price,
        item.totalQuantity * item.menuItem.price,
      ]);
    }
  });
  mainData.push([]);

  // Storage Transactions
  if (data.spendings.items.length > 0) {
    mainData.push(["GASTOS DE ALMACÉN"]);
    mainData.push([
      "Tipo",
      "Producto",
      "Categoría",
      "Cantidad",
      "Costo Unitario (S/)",
      "Subtotal (S/)",
      "Responsable",
    ]);
    data.spendings.items.forEach((item: any) => {
      mainData.push([
        item.type === "PURCHASE" ? "Compra" : "Merma",
        item.storageItemName,
        item.category,
        item.quantityChange.toFixed(2),
        item.costPerUnit.toFixed(2),
        item.subtotal.toFixed(2),
        item.performedBy,
      ]);
    });
    mainData.push([]);
  }

  // Inventory Changes
  if (data.inventoryChanges.length > 0) {
    mainData.push(["MOVIMIENTOS DE INVENTARIO"]);
    mainData.push([
      "Producto",
      "Stock Actual",
      "Transferido",
      "Costo Unit. (S/)",
      "Unidad",
      "Categoría",
      "Última Modificación",
    ]);
    data.inventoryChanges.forEach((item: any) => {
      mainData.push([
        item.name,
        item.quantity.toFixed(2),
        (item.storage_transfer || 0).toFixed(2),
        item.costPerUnit ? item.costPerUnit.toFixed(2) : "—",
        item.unit,
        item.category || "—",
        item.updatedAt.toLocaleString("es-PE"),
      ]);
    });
    mainData.push([]);
  }

  // Manual Adjustments - NEW SECTION
  if (data.manualAdjustments && data.manualAdjustments.length > 0) {
    mainData.push(["AJUSTES MANUALES DE INVENTARIO"]);
    mainData.push([
      "Fecha",
      "Item",
      "Categoría",
      "Tipo",
      "Cambio",
      "Motivo",
      "Usuario",
    ]);
    data.manualAdjustments.forEach((adj: any) => {
      mainData.push([
        new Date(adj.createdAt).toLocaleString("es-PE"),
        adj.inventoryItem.name,
        adj.inventoryItem.category || "General",
        adj.type === "RESTOCK" ? "Reposición" : "Uso Manual",
        adj.quantityChange > 0
          ? `+${adj.quantityChange.toFixed(2)}`
          : adj.quantityChange.toFixed(2),
        adj.reason,
        adj.performedBy?.name || "Sistema",
      ]);
    });
    mainData.push([]);
  }

  // Void Records
  if (data.voidRecords.length > 0) {
    mainData.push(["ANULACIONES"]);
    mainData.push(["Personal", "Tipo", "Detalles", "Total Anulados", "Motivo"]);
    data.voidRecords.forEach((record: any) => {
      mainData.push([
        record.voidedBy?.name || "Desconocido",
        record.target,
        record.targetDetails || "Sin detalles",
        record.totalVoided,
        record.reason || "—",
      ]);
    });
    mainData.push([]);
  }

  // Final Totals
  mainData.push(["TOTALES FINALES"]);
  mainData.push(["Total Ítems Vendidos", data.totalItems]);
  mainData.push([
    "Total Ítems Anulados",
    data.voidRecords.reduce((sum, r) => sum + r.totalVoided, 0),
  ]);
  mainData.push(["Total Cash", data.sales.totalCash]);
  mainData.push(["Total Yape", data.sales.totalYape]);
  mainData.push(["Total Gastos", data.spendings.total]);
  mainData.push(["Neto del Día", data.spendings.netProfit]);
  mainData.push(["Margen", `${data.spendings.marginPercent.toFixed(2)}%`]);

  const mainSheet = XLSX.utils.aoa_to_sheet(mainData);

  // Auto column widths
  const colWidths =
    mainData[0]?.map((_, i) => {
      const maxWidth = Math.max(
        ...mainData.map((row) => (row[i] ? String(row[i]).length : 0)),
      );
      return { wch: Math.min(40, Math.max(10, maxWidth + 2)) };
    }) || [];
  mainSheet["!cols"] = colWidths;

  // Bold headers logic (simplified)
  const boldCells = new Set<string>();
  let rowIndex = 0;
  while (rowIndex < mainData.length) {
    const row = mainData[rowIndex];
    if (row.length === 0 || (row.length === 1 && row[0] === "")) {
      rowIndex++;
      continue;
    }
    if (
      row.length === 1 &&
      typeof row[0] === "string" &&
      row[0].toUpperCase() === row[0]
    ) {
      boldCells.add(`A${rowIndex + 1}`);
    } else if (
      rowIndex > 0 &&
      mainData[rowIndex - 1].length === 0 &&
      row.some((cell) => typeof cell === "string")
    ) {
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const colLetter = String.fromCharCode(65 + colIndex);
        boldCells.add(`${colLetter}${rowIndex + 1}`);
      }
    } else if (
      (row.length >= 2 &&
        typeof row[0] === "string" &&
        row[0].includes("Total")) ||
      row[0] === "Neto del Día" ||
      row[0] === "Margen"
    ) {
      boldCells.add(`A${rowIndex + 1}`);
      boldCells.add(`B${rowIndex + 1}`);
    }
    rowIndex++;
  }

  boldCells.forEach((cellRef) => {
    if (mainSheet[cellRef]) {
      mainSheet[cellRef].s = { font: { bold: true } };
    }
  });

  XLSX.utils.book_append_sheet(workbook, mainSheet, "Reporte Diario");

  // 2. Optional: Dedicated Sheet for Manual Adjustments
  if (data.manualAdjustments && data.manualAdjustments.length > 0) {
    const adjData: any[][] = [];
    adjData.push(["REGISTRO DETALLADO DE AJUSTES MANUALES"]);
    adjData.push([`Generado: ${new Date().toLocaleString("es-PE")}`]);
    adjData.push([]);
    adjData.push([
      "ID",
      "Fecha",
      "Item",
      "Categoría",
      "Tipo",
      "Cambio",
      "Motivo",
      "Usuario",
    ]);

    data.manualAdjustments.forEach((adj: any) => {
      adjData.push([
        adj.id,
        new Date(adj.createdAt).toLocaleString("es-PE"),
        adj.inventoryItem.name,
        adj.inventoryItem.category || "General",
        adj.type,
        adj.quantityChange,
        adj.reason,
        adj.performedBy?.name || "Sistema",
      ]);
    });

    const adjSheet = XLSX.utils.aoa_to_sheet(adjData);
    XLSX.utils.book_append_sheet(workbook, adjSheet, "Ajustes Manuales");
  }

  const dateStr = data.date.toLocaleDateString("es-PE").replace(/\//g, "-");
  XLSX.writeFile(workbook, `Cierre_Diario_${dateStr}.xlsx`);
}
