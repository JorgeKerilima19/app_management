import * as XLSX from "xlsx";
import type { ClosingData } from "@/app/(auth)/dashboard/close/CloseClient";

// ✅ Helper: Extract void details from metadata (new) or fallback (old)
function getVoidExportData(record: any) {
  const metadata = record.metadata as any;

  if (record.target === "ORDER_ITEM" && metadata?.menuItem) {
    return {
      itemName: metadata.menuItem.name,
      category: metadata.menuItem.category || "Otro",
      quantity: metadata.quantities?.voided || 1,
      price: parseFloat(metadata.menuItem.price || "0"),
      table: metadata.table
        ? `Mesa ${metadata.table.number}${metadata.table.name ? ` (${metadata.table.name})` : ""}`
        : "N/A",
      amount: (
        parseFloat(metadata.menuItem.price || "0") *
        (metadata.quantities?.voided || 1)
      ).toFixed(2),
    };
  }

  if (record.target === "CHECK" && metadata?.check) {
    return {
      itemName: "Cuenta completa",
      category: "CHECK",
      quantity: metadata.check.itemCount || 1,
      price: parseFloat(metadata.check.total || "0"),
      table:
        metadata.tables
          ?.map((t: any) => `Mesa ${t.number}${t.name ? ` (${t.name})` : ""}`)
          .join(", ") || "N/A",
      amount: parseFloat(metadata.check.total || "0").toFixed(2),
    };
  }

  // 🔄 Fallback for old voids without metadata
  return {
    itemName: record.targetDetails?.split("—")[0]?.trim() || "Ítem desconocido",
    category: "N/A",
    quantity: record.totalVoided || 1,
    price: 0,
    table: record.targetDetails?.split("—")[1]?.trim() || "N/A",
    amount: record.totalVoided,
  };
}

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

  // Manual Adjustments
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

  // ✅ Void Records - UPDATED to use metadata
  if (data.voidRecords.length > 0) {
    mainData.push(["ANULACIONES"]);
    mainData.push([
      "Fecha/Hora",
      "Personal",
      "Tipo",
      "Ítem",
      "Mesa(s)",
      "Motivo",
    ]);

    data.voidRecords.forEach((record: any) => {
      const voidData = getVoidExportData(record);
      const voidedAt = record.createdAt
        ? new Date(record.createdAt).toLocaleString("es-PE")
        : "";

      mainData.push([
        voidedAt,
        record.voidedBy?.name || "Desconocido",
        record.target,
        voidData.itemName,
        voidData.table,
        record.reason || "—",
      ]);
    });
    mainData.push([]);
  }

  // Final Totals
  mainData.push(["TOTALES FINALES"]);
  mainData.push(["Total Ítems Vendidos", data.totalItems]);

  // Calculate total voided amount from metadata-aware records
  const totalVoidedAmount = data.voidRecords.reduce((sum, r: any) => {
    const voidData = getVoidExportData(r);
    return sum + parseFloat(voidData.amount || "0");
  }, 0);

  mainData.push([
    "Total Ítems Anulados (cantidad)",
    data.voidRecords.reduce((sum, r) => sum + (r.totalVoided || 0), 0),
  ]);
  mainData.push(["Total Anulado (S/)", totalVoidedAmount.toFixed(2)]);
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
      return { wch: Math.min(50, Math.max(10, maxWidth + 2)) };
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

  // 2. Optional: Dedicated Sheet for Voids
  if (data.voidRecords.length > 0) {
    const voidData: any[][] = [];
    voidData.push(["REGISTRO DETALLADO DE ANULACIONES"]);
    voidData.push([`Generado: ${new Date().toLocaleString("es-PE")}`]);
    voidData.push([]);
    voidData.push([
      "ID",
      "Fecha/Hora",
      "Usuario",
      "Tipo",
      "Ítem",
      "Categoría",
      "Mesa(s)",
      "Cantidad Anulada",
      "Precio Unit. (S/)",
      "Total (S/)",
      "Motivo",
      "Nota Interna",
    ]);

    data.voidRecords.forEach((record: any) => {
      const voidDataItem = getVoidExportData(record);
      voidData.push([
        record.id,
        record.createdAt
          ? new Date(record.createdAt).toLocaleString("es-PE")
          : "",
        record.voidedBy?.name || "Sistema",
        record.target,
        voidDataItem.itemName,
        voidDataItem.category,
        voidDataItem.table,
        voidDataItem.quantity,
        voidDataItem.price.toFixed(2),
        voidDataItem.amount,
        record.reason || "—",
        record.note || "",
      ]);
    });

    const voidSheet = XLSX.utils.aoa_to_sheet(voidData);
    XLSX.utils.book_append_sheet(workbook, voidSheet, "Anulaciones");
  }

  // 3. Optional: Dedicated Sheet for Manual Adjustments
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
