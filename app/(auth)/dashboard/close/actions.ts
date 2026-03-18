/// app/dashboard/close/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return parseFloat(value.toString());
}

export async function closeRestaurant() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const summary = await prisma.dailySummary.findUnique({
    where: { date: today, status: "OPEN" },
  });

  if (!summary) {
    throw new Error("No hay resumen diario activo");
  }

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: today },
      check: { status: "CLOSED" },
    },
  });

  let totalCash = 0;
  let totalYape = 0;

  payments.forEach((p) => {
    if (p.method === "CASH" || p.method === "MIXED") {
      totalCash += p.cashAmount ? toNumber(p.cashAmount) : toNumber(p.amount);
    }
    if (p.method === "MOBILE_PAY" || p.method === "MIXED") {
      totalYape += p.yapeAmount ? toNumber(p.yapeAmount) : 0;
    }
  });

  const endingCash = toNumber(summary.startingCash) + totalCash;

  await prisma.dailySummary.update({
    where: { id: summary.id },
    data: {
      totalCash: totalCash,
      totalYape: totalYape,
      endingCash: endingCash,
      status: "CLOSED",
      closedById: user.id,
      closedAt: new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/close");
}

export async function fetchClosingSummary(
  categoryId?: string,
  page: number = 1,
  itemsPerPage: number = 10,
) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setHours(23, 59, 59, 999);

  const dailySummary = await prisma.dailySummary.findUnique({
    where: { date: today },
  });

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: today, lte: tomorrow },
      check: { status: "CLOSED" },
    },
  });

  let totalCash = 0;
  let totalYape = 0;

  payments.forEach((p) => {
    if (p.method === "CASH" || p.method === "MIXED") {
      totalCash += p.cashAmount ? toNumber(p.cashAmount) : toNumber(p.amount);
    }
    if (p.method === "MOBILE_PAY" || p.method === "MIXED") {
      totalYape += p.yapeAmount ? toNumber(p.yapeAmount) : 0;
    }
  });

  // === SPENDINGS ===
  const storageTransactions = await prisma.storageTransaction.findMany({
    where: {
      type: { in: ["PURCHASE", "WASTE"] },
      createdAt: { gte: today, lte: tomorrow },
      storageItem: { costPerUnit: { not: null } },
    },
    include: {
      storageItem: {
        select: { costPerUnit: true, name: true, category: true },
      },
      performedBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSpendings = storageTransactions.reduce((sum, t) => {
    const cost = toNumber(t.storageItem.costPerUnit || 0);
    const qty =
      t.quantityChange > 0 ? t.quantityChange : Math.abs(t.quantityChange);
    return sum + qty * cost;
  }, 0);

  const totalSales = totalCash + totalYape;
  const netProfit = totalSales - totalSpendings;
  const marginPercent = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  const skip = (page - 1) * itemsPerPage;

  const itemGroups = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      createdAt: { gte: today, lte: tomorrow },
      order: {
        check: {
          status: "CLOSED",
          closedAt: { gte: today, lte: tomorrow },
        },
      },
      menuItem: categoryId ? { categoryId } : undefined,
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
  });

  const paginatedItemGroups = itemGroups.slice(skip, skip + itemsPerPage);
  const totalItems = itemGroups.length;

  const menuItemIds = paginatedItemGroups.map((g) => g.menuItemId);
  let menuItemsMap = new Map();
  if (menuItemIds.length > 0) {
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: { category: true },
    });
    menuItemsMap = new Map(menuItems.map((m) => [m.id, m]));
  }

  const itemsSold = paginatedItemGroups.map((g) => {
    const menuItem = menuItemsMap.get(g.menuItemId);
    const totalQuantity = g._sum.quantity || 0;
    const totalSales = menuItem ? totalQuantity * toNumber(menuItem.price) : 0;

    return {
      menuItem: menuItem ?? null,
      totalQuantity,
      totalSales,
    };
  });

  // === INVENTORY CHANGES ===
  const inventoryChanges = await prisma.$queryRaw`
  SELECT 
    i.id,
    i.name,
    i."currentQuantity" as quantity,
    i.unit,
    i.category,
    i.notes,
    i."costPerUnit",
    i."updatedAt",
    COALESCE(st."transfer_qty", 0) as storage_transfer
  FROM "InventoryItem" i
  LEFT JOIN (
    SELECT 
      "referenceId",
      SUM("quantityChange") as "transfer_qty"
    FROM "StorageTransaction"
    WHERE "type" = 'TRANSFER_TO_INVENTORY'
      AND "referenceModel" = 'InventoryItem'
      AND "createdAt" >= ${today}
      AND "createdAt" < ${tomorrow}
    GROUP BY "referenceId"
  ) st ON i.id = st."referenceId"
  WHERE i."updatedAt" >= ${today}
     OR st."transfer_qty" IS NOT NULL
  ORDER BY i.name ASC
`;

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // === ✅ VOID RECORDS - METADATA-FIRST APPROACH ===
  const voidRecords = await prisma.voidRecord.findMany({
    where: { createdAt: { gte: today, lte: tomorrow } },
    include: {
      voidedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const processedVoidRecords = voidRecords.map((record) => {
    const metadata = record.metadata as any;

    const typeLabels: Record<string, string> = {
      ORDER_ITEM: "Item Anulado",
      ORDER: "Orden Anulada",
      CHECK: "Cuenta Anulada",
    };
    const targetType = typeLabels[record.target] || record.target;

    let targetDetails = "";
    let totalVoided = 0;

    if (record.target === "ORDER_ITEM" && metadata?.menuItem) {
      const tableInfo = metadata.table
        ? `Mesa ${metadata.table.number}${metadata.table.name ? ` (${metadata.table.name})` : ""}`
        : "Mesa N/A";
      const qty = metadata.quantities?.voided || 1;
      targetDetails = `${metadata.menuItem.name} ×${qty} — ${tableInfo}`;
      totalVoided = qty;
    } else if (
      record.target === "CHECK" &&
      metadata?.check &&
      metadata?.tables?.length
    ) {
      const tableNames = metadata.tables
        .map((t: any) => `Mesa ${t.number}${t.name ? ` (${t.name})` : ""}`)
        .join(", ");
      const itemCount = metadata.check.itemCount || 0;
      targetDetails = `${itemCount} items — Mesas ${tableNames}`;
      totalVoided = itemCount;
    } else if (record.target === "ORDER" && metadata?.tables?.length) {
      // 🎯 Order void with snapshot
      const tableNames = metadata.tables
        .map((t: any) => `Mesa ${t.number}${t.name ? ` (${t.name})` : ""}`)
        .join(", ");
      targetDetails = `Orden — Mesa ${tableNames}`;
      totalVoided = 1;
    } else {
      targetDetails = record.note || record.reason || "Detalles no disponibles";
      totalVoided = record.target === "ORDER_ITEM" ? 1 : 0;
    }

    return {
      id: record.id,
      voidedBy: record.voidedBy,
      target: targetType,
      targetDetails,
      totalVoided,
      reason: record.reason,
      createdAt: record.createdAt,
      // ✅ Include raw metadata for Excel export flexibility
      _metadata: metadata,
    };
  });

  // === SERIALIZE STORAGE TRANSACTIONS ===
  const serializedStorageTransactions = storageTransactions.map((t) => ({
    id: t.id,
    type: t.type,
    storageItemName: t.storageItem.name,
    quantityChange: t.quantityChange,
    costPerUnit: toNumber(t.storageItem.costPerUnit),
    subtotal: t.quantityChange * toNumber(t.storageItem.costPerUnit),
    category: t.storageItem.category || "—",
    performedBy: t.performedBy?.name || "Desconocido",
    createdAt: t.createdAt,
  }));

  const serializedInventoryChanges = (inventoryChanges as any[]).map(
    (item) => ({
      id: item.id,
      name: item.name,
      quantity: toNumber(item.quantity),
      unit: item.unit,
      category: item.category,
      notes: item.notes,
      costPerUnit: item.costPerUnit ? toNumber(item.costPerUnit) : null,
      updatedAt:
        item.updatedAt instanceof Date
          ? item.updatedAt
          : new Date(item.updatedAt),
      storage_transfer: item.storage_transfer
        ? toNumber(item.storage_transfer)
        : 0,
    }),
  );

  return {
    dailySummary: dailySummary
      ? {
          id: dailySummary.id,
          startingCash: toNumber(dailySummary.startingCash),
          endingCash: dailySummary.endingCash
            ? toNumber(dailySummary.endingCash)
            : 0,
          status: dailySummary.status,
        }
      : null,
    sales: {
      totalCash,
      totalYape,
      totalOverall: totalSales,
    },
    spendings: {
      total: totalSpendings,
      netProfit,
      marginPercent,
      items: serializedStorageTransactions,
    },
    itemsSold,
    totalItems,
    inventoryChanges: serializedInventoryChanges,
    categories,
    voidRecords: processedVoidRecords,
    date: today,
    currentPage: page,
    itemsPerPage,
  };
}
