// lib/excelExport.ts
import * as XLSX from "xlsx";
import type {
  ClosingData,
  Turn,
} from "@/app/(auth)/dashboard/close/CloseClient";

function getVoidExportData(record: any) {
  const metadata = record.metadata as any;

  // 🎯 ORDER_ITEM: Use detailed metadata
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

  // 🎯 CHECK: Build detailed item summary from metadata.items array
  if (record.target === "CHECK" && metadata?.check) {
    // Build concise item summary: "Chaufa ×2, Coca ×3... y 2 más"
    let itemSummary = "Sin items";
    if (
      metadata.items &&
      Array.isArray(metadata.items) &&
      metadata.items.length > 0
    ) {
      const displayItems = metadata.items
        .slice(0, 4)
        .map((i: any) => `${i.name} ×${i.quantity}`);
      const remaining = metadata.items.length - 4;
      itemSummary = `${displayItems.join(", ")}${remaining > 0 ? `... y ${remaining} más` : ""}`;
    } else {
      itemSummary = `${metadata.check.itemCount || 0} items`;
    }

    return {
      itemName: itemSummary,
      category: "Cuenta",
      quantity: metadata.check.itemCount || 1,
      price: parseFloat(metadata.check.total || "0"),
      table:
        metadata.tables
          ?.map((t: any) => `Mesa ${t.number}${t.name ? ` (${t.name})` : ""}`)
          .join(", ") || "N/A",
      amount: parseFloat(metadata.check.total || "0").toFixed(2),
    };
  }

  if (record.target === "ORDER" && metadata?.tables?.length) {
    return {
      itemName: "Orden completa",
      category: "ORDER",
      quantity: 1,
      price: 0,
      table:
        metadata.tables
          ?.map((t: any) => `Mesa ${t.number}${t.name ? ` (${t.name})` : ""}`)
          .join(", ") || "N/A",
      amount: "0.00",
    };
  }

  return {
    itemName:
      record.targetDetails?.split("•")[1]?.trim() ||
      record.targetDetails?.split("—")[0]?.trim() ||
      "Ítem desconocido",
    category: "N/A",
    quantity: record.totalVoided || 1,
    price: 0,
    table:
      record.targetDetails?.split("•")[0]?.split("Mesas")?.[1]?.trim() ||
      record.targetDetails?.split("—")[1]?.trim() ||
      "N/A",
    amount: record.totalVoided,
  };
}
// ✅ Helper: Safe number formatting
function fmt(n: number | null | undefined, decimals: number = 2): string {
  if (n == null) return "—";
  return n.toFixed(decimals);
}

// ✅ Helper: Safe date formatting
function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString("es-PE");
}

export function exportClosingReportToExcel(data: ClosingData) {
  const workbook = XLSX.utils.book_new();

  // ============================================================================
  // 1️⃣ MAIN REPORT SHEET
  // ============================================================================
  const mainData: any[][] = [];

  // Header
  mainData.push([
    "REPORTE DE CIERRE DIARIO",
    `Fecha: ${data.date.toLocaleDateString("es-PE")}`,
  ]);
  mainData.push([`Generado: ${new Date().toLocaleString("es-PE")}`, ""]);
  mainData.push([]);

  // Financial Summary
  mainData.push(["RESUMEN FINANCIERO", ""]);
  mainData.push(["Concepto", "Monto (S/)"]);
  mainData.push(["Apertura", fmt(data.dailySummary?.startingCash)]);
  mainData.push(["Ventas Efectivo", fmt(data.sales.totalCash)]);
  mainData.push(["Ventas Yape", fmt(data.sales.totalYape)]);
  mainData.push(["Total Ventas", fmt(data.sales.totalOverall)]);
  mainData.push(["Gastos (Compras + Mermas)", fmt(data.spendings.total)]);
  mainData.push(["Neto del Día", fmt(data.spendings.netProfit)]);
  mainData.push(["Margen (%)", `${data.spendings.marginPercent.toFixed(2)}%`]);
  mainData.push([]);

  // ✅ TURN SUMMARY (Main Sheet - Compact View)
  if (data.turns && data.turns.length > 0) {
    mainData.push(["RESUMEN POR TURNOS", ""]);
    mainData.push([
      "Turno",
      "Inicio (S/)",
      "Cierre (S/)",
      "Ventas (S/)",
      "Cerrado por",
      "Hora Cierre",
    ]);

    data.turns.forEach((turn: Turn) => {
      mainData.push([
        turn.name,
        fmt(turn.start),
        turn.end !== null ? fmt(turn.end) : "—",
        turn.salesSnapshot?.total != null ? fmt(turn.salesSnapshot.total) : "—",
        turn.closedByName || "—",
        fmtDate(turn.closedAt),
      ]);
    });

    // Total row for turns
    const totalStart = data.turns.reduce((s, t) => s + t.start, 0);
    const totalEnd = data.turns.reduce((s, t) => s + (t.end || 0), 0);
    const totalSales = data.turns.reduce(
      (s, t) => s + (t.salesSnapshot?.total || 0),
      0,
    );
    const totalVariance = data.turns.reduce((s, t) => s + (t.variance || 0), 0);

    mainData.push([
      "TOTAL TURNOS",
      fmt(totalStart),
      fmt(totalEnd),
      fmt(totalSales),
      totalVariance >= 0 ? `+${fmt(totalVariance)}` : fmt(totalVariance),
      "",
      "",
    ]);
    mainData.push([]);
  }

  // Items Sold
  if (data.itemsSold.length > 0) {
    mainData.push(["ÍTEMS MÁS VENDIDOS", ""]);
    mainData.push([
      "Ítem",
      "Categoría",
      "Cantidad",
      "Precio Unit. (S/)",
      "Total (S/)",
    ]);
    data.itemsSold.forEach((item) => {
      if (item.menuItem) {
        const price = parseFloat(item.menuItem.price?.toString() || "0");
        mainData.push([
          item.menuItem.name,
          item.menuItem.category?.name || "Otro",
          item.totalQuantity,
          fmt(price),
          fmt(item.totalQuantity * price),
        ]);
      }
    });
    mainData.push([]);
  }

  // Storage Transactions (Gastos de Almacén)
  if (data.spendings.items.length > 0) {
    mainData.push(["GASTOS DE ALMACÉN", ""]);
    mainData.push([
      "Tipo",
      "Producto",
      "Categoría",
      "Cantidad",
      "Costo Unit. (S/)",
      "Subtotal (S/)",
      "Responsable",
    ]);
    data.spendings.items.forEach((item) => {
      mainData.push([
        item.type === "PURCHASE" ? "Compra" : "Merma",
        item.storageItemName,
        item.category || "—",
        fmt(item.quantityChange, 3),
        fmt(item.costPerUnit),
        fmt(item.subtotal),
        item.performedBy,
      ]);
    });
    mainData.push([]);
  }

  // Inventory Changes
  if (data.inventoryChanges.length > 0) {
    mainData.push(["MOVIMIENTOS DE INVENTARIO", ""]);
    mainData.push([
      "Producto",
      "Stock Actual",
      "Transferido",
      "Costo Unit. (S/)",
      "Unidad",
      "Categoría",
      "Última Modificación",
    ]);
    data.inventoryChanges.forEach((item) => {
      mainData.push([
        item.name,
        fmt(item.quantity, 3),
        fmt(item.storage_transfer || 0, 3),
        item.costPerUnit != null ? fmt(item.costPerUnit) : "—",
        item.unit,
        item.category || "—",
        fmtDate(item.updatedAt),
      ]);
    });
    mainData.push([]);
  }

  // Manual Adjustments
  if (data.manualAdjustments && data.manualAdjustments.length > 0) {
    mainData.push(["AJUSTES MANUALES DE INVENTARIO", ""]);
    mainData.push([
      "Fecha",
      "Item",
      "Categoría",
      "Tipo",
      "Cambio",
      "Motivo",
      "Usuario",
    ]);
    data.manualAdjustments.forEach((adj) => {
      mainData.push([
        fmtDate(adj.createdAt),
        adj.inventoryItem.name,
        adj.inventoryItem.category || "General",
        adj.type === "RESTOCK" ? "Reposición" : "Uso Manual",
        adj.quantityChange > 0
          ? `+${fmt(adj.quantityChange, 3)}`
          : fmt(adj.quantityChange, 3),
        adj.reason,
        adj.performedBy?.name || "Sistema",
      ]);
    });
    mainData.push([]);
  }

  // Void Records
  if (data.voidRecords.length > 0) {
    mainData.push(["ANULACIONES", ""]);
    mainData.push([
      "Fecha/Hora",
      "Personal",
      "Tipo",
      "Ítem",
      "Mesa(s)",
      "Motivo",
    ]);

    data.voidRecords.forEach((record) => {
      const voidData = getVoidExportData(record);
      mainData.push([
        fmtDate(record.createdAt),
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
  mainData.push(["TOTALES FINALES", ""]);
  mainData.push(["Total Ítems Vendidos", data.totalItems]);

  const totalVoidedQty = data.voidRecords.reduce(
    (sum, r) => sum + (r.totalVoided || 0),
    0,
  );
  const totalVoidedAmount = data.voidRecords.reduce((sum, r) => {
    const vd = getVoidExportData(r);
    return sum + parseFloat(vd.amount || "0");
  }, 0);

  mainData.push(["Total Ítems Anulados (cantidad)", totalVoidedQty]);
  mainData.push(["Total Anulado (S/)", fmt(totalVoidedAmount)]);
  mainData.push(["Total Cash", fmt(data.sales.totalCash)]);
  mainData.push(["Total Yape", fmt(data.sales.totalYape)]);
  mainData.push(["Total Gastos", fmt(data.spendings.total)]);
  mainData.push(["Neto del Día", fmt(data.spendings.netProfit)]);
  mainData.push(["Margen", `${data.spendings.marginPercent.toFixed(2)}%`]);

  const mainSheet = XLSX.utils.aoa_to_sheet(mainData);

  // Auto column widths for main sheet
  const maxCols = Math.max(...mainData.map((row) => row.length));
  mainSheet["!cols"] = Array.from({ length: maxCols }, (_, i) => {
    const maxWidth = Math.max(
      10,
      ...mainData.map((row) => (row[i] ? String(row[i]).length : 0)),
    );
    return { wch: Math.min(50, maxWidth + 2) };
  });

  // Bold headers logic
  const boldCells = new Set<string>();
  mainData.forEach((row, rowIndex) => {
    if (row.length === 0) return;

    // Section headers (all caps or single non-empty cell)
    if (
      (row.length === 1 &&
        typeof row[0] === "string" &&
        row[0].toUpperCase() === row[0]) ||
      (row.length > 1 &&
        typeof row[0] === "string" &&
        row[0].includes("RESUMEN")) ||
      row[0].includes("TOTAL")
    ) {
      boldCells.add(`A${rowIndex + 1}`);
      return;
    }

    // Column headers (after empty row)
    if (
      rowIndex > 0 &&
      mainData[rowIndex - 1]?.length === 0 &&
      row.some((c) => typeof c === "string")
    ) {
      for (let col = 0; col < row.length; col++) {
        boldCells.add(`${String.fromCharCode(65 + col)}${rowIndex + 1}`);
      }
      return;
    }

    // Total rows
    if (
      row[0]?.toString().includes("Total") ||
      row[0] === "Neto del Día" ||
      row[0] === "Margen"
    ) {
      boldCells.add(`A${rowIndex + 1}`);
      if (row[1] != null) boldCells.add(`B${rowIndex + 1}`);
    }
  });

  boldCells.forEach((cellRef) => {
    if (mainSheet[cellRef]) {
      mainSheet[cellRef].s = { font: { bold: true } };
    }
  });

  XLSX.utils.book_append_sheet(workbook, mainSheet, "Reporte Diario");

  // ============================================================================
  // 2️⃣ DEDICATED "TURNOS" SHEET (Detailed Breakdown)
  // ============================================================================
  if (data.turns && data.turns.length > 0) {
    const turnData: any[][] = [];

    // Header
    turnData.push(["DESGLOSE DETALLADO POR TURNOS"]);
    turnData.push([
      `Fecha del Cierre: ${data.date.toLocaleDateString("es-PE")}`,
    ]);
    turnData.push([`Generado: ${new Date().toLocaleString("es-PE")}`]);
    turnData.push([]);

    // Column Headers
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

    // Data Rows
    data.turns.forEach((turn: Turn) => {
      turnData.push([
        turn.name,
        fmt(turn.start),
        turn.end !== null ? fmt(turn.end) : "—",
        turn.salesSnapshot?.cash != null ? fmt(turn.salesSnapshot.cash) : "—",
        turn.salesSnapshot?.yape != null ? fmt(turn.salesSnapshot.yape) : "—",
        turn.salesSnapshot?.total != null ? fmt(turn.salesSnapshot.total) : "—",
        turn.expectedCash != null ? fmt(turn.expectedCash) : "—",
        turn.variance != null
          ? turn.variance >= 0
            ? `+${fmt(turn.variance)}`
            : fmt(turn.variance)
          : "—",
        turn.closedByName || "—",
        fmtDate(turn.closedAt),
        turn.note || "—",
      ]);
    });

    // Summary Totals Row
    turnData.push([]);
    turnData.push(["TOTALES ACUMULADOS"]);

    const totals = {
      start: data.turns.reduce((s, t) => s + t.start, 0),
      end: data.turns.reduce((s, t) => s + (t.end || 0), 0),
      cash: data.turns.reduce((s, t) => s + (t.salesSnapshot?.cash || 0), 0),
      yape: data.turns.reduce((s, t) => s + (t.salesSnapshot?.yape || 0), 0),
      total: data.turns.reduce((s, t) => s + (t.salesSnapshot?.total || 0), 0),
      expected: data.turns.reduce((s, t) => s + (t.expectedCash || 0), 0),
      variance: data.turns.reduce((s, t) => s + (t.variance || 0), 0),
    };

    turnData.push([
      "",
      fmt(totals.start),
      fmt(totals.end),
      fmt(totals.cash),
      fmt(totals.yape),
      fmt(totals.total),
      fmt(totals.expected),
      totals.variance >= 0 ? `+${fmt(totals.variance)}` : fmt(totals.variance),
      "",
      "",
      "",
    ]);

    const turnSheet = XLSX.utils.aoa_to_sheet(turnData);

    // Column widths for turn sheet
    turnSheet["!cols"] = [
      { wch: 10 }, // Turno
      { wch: 15 }, // Efectivo Inicial
      { wch: 15 }, // Efectivo Final
      { wch: 15 }, // Ventas Efectivo
      { wch: 15 }, // Ventas Yape
      { wch: 15 }, // Total Ventas
      { wch: 18 }, // Efectivo Esperado
      { wch: 12 }, // Varianza
      { wch: 20 }, // Cerrado por
      { wch: 22 }, // Fecha/Hora Cierre
      { wch: 30 }, // Notas
    ];

    // Bold header row (row 4, 0-indexed = row 3)
    const headerRowIndex = 4;
    for (let col = 0; col < 11; col++) {
      const cellRef = `${String.fromCharCode(65 + col)}${headerRowIndex + 1}`;
      if (turnSheet[cellRef]) {
        turnSheet[cellRef].s = { font: { bold: true } };
      }
    }

    // Bold totals row
    const totalsRowIndex = turnData.length - 1;
    for (let col = 0; col < 8; col++) {
      const cellRef = `${String.fromCharCode(65 + col)}${totalsRowIndex + 1}`;
      if (turnSheet[cellRef]) {
        turnSheet[cellRef].s = { font: { bold: true } };
      }
    }

    XLSX.utils.book_append_sheet(workbook, turnSheet, "Turnos");
  }

  // ============================================================================
  // 3️⃣ DEDICATED "ANULACIONES" SHEET
  // ============================================================================
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
      "Cantidad",
      "Precio Unit. (S/)",
      "Total (S/)",
      "Motivo",
      "Nota Interna",
    ]);

    data.voidRecords.forEach((record) => {
      const vd = getVoidExportData(record);
      voidData.push([
        record.id,
        fmtDate(record.createdAt),
        record.voidedBy?.name || "Sistema",
        record.target,
        vd.itemName,
        vd.category,
        vd.table,
        vd.quantity,
        fmt(vd.price),
        vd.amount,
        record.reason || "—",
      ]);
    });

    const voidSheet = XLSX.utils.aoa_to_sheet(voidData);
    voidSheet["!cols"] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 25 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 30 },
    ];

    // Bold header
    for (let col = 0; col < 12; col++) {
      const cellRef = `${String.fromCharCode(65 + col)}4`;
      if (voidSheet[cellRef]) {
        voidSheet[cellRef].s = { font: { bold: true } };
      }
    }

    XLSX.utils.book_append_sheet(workbook, voidSheet, "Anulaciones");
  }

  // ============================================================================
  // 4️⃣ DEDICATED "AJUSTES MANUALES" SHEET
  // ============================================================================
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

    data.manualAdjustments.forEach((adj) => {
      adjData.push([
        adj.id,
        fmtDate(adj.createdAt),
        adj.inventoryItem.name,
        adj.inventoryItem.category || "General",
        adj.type,
        adj.quantityChange > 0
          ? `+${fmt(adj.quantityChange, 3)}`
          : fmt(adj.quantityChange, 3),
        adj.reason,
        adj.performedBy?.name || "Sistema",
      ]);
    });

    const adjSheet = XLSX.utils.aoa_to_sheet(adjData);
    adjSheet["!cols"] = [
      { wch: 25 },
      { wch: 22 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 40 },
      { wch: 20 },
    ];

    // Bold header
    for (let col = 0; col < 8; col++) {
      const cellRef = `${String.fromCharCode(65 + col)}4`;
      if (adjSheet[cellRef]) {
        adjSheet[cellRef].s = { font: { bold: true } };
      }
    }

    XLSX.utils.book_append_sheet(workbook, adjSheet, "Ajustes Manuales");
  }

  // ============================================================================
  // SAVE FILE
  // ============================================================================
  const dateStr = data.date.toLocaleDateString("es-PE").replace(/\//g, "-");
  XLSX.writeFile(workbook, `Cierre_Diario_${dateStr}.xlsx`);
}
