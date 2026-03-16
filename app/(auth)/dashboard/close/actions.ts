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

  // === INVENTORY CHANGES - FIXED SQL QUERY ===
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

  // === VOID RECORDS - Bulletproof Processing ===
  const voidRecords = await prisma.voidRecord.findMany({
    where: { createdAt: { gte: today, lte: tomorrow } },
    include: {
      voidedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const orderIds: string[] = [];
  const orderItemIds: string[] = [];
  const checkIds: string[] = [];

  voidRecords.forEach((record) => {
    if (record.target === "ORDER") orderIds.push(record.targetId);
    else if (record.target === "ORDER_ITEM") orderItemIds.push(record.targetId);
    else if (record.target === "CHECK") checkIds.push(record.targetId);
  });

  // ✅ Fetch OrderItems with menuItem relation
  const orderItemsMap = new Map<
    string,
    { name: string; quantity: number; tableName?: string }
  >();
  if (orderItemIds.length > 0) {
    const items = await prisma.orderItem.findMany({
      where: { id: { in: orderItemIds } },
      include: {
        menuItem: { select: { name: true } },
        order: {
          include: {
            check: {
              select: { tableIds: true },
            },
          },
        },
      },
    });

    // Fetch tables for table names
    const allTableIds = new Set<string>();
    items.forEach((item) => {
      try {
        const ids = JSON.parse(item.order.check.tableIds as string);
        if (Array.isArray(ids)) {
          ids.forEach((id) => allTableIds.add(id));
        }
      } catch {}
    });

    const tables = await prisma.table.findMany({
      where: { id: { in: Array.from(allTableIds) } },
      select: { id: true, number: true, name: true },
    });
    const tableMap = new Map(
      tables.map((t) => [t.id, t.name || `Mesa ${t.number}`]),
    );

    items.forEach((item) => {
      let tableName = "N/A";
      try {
        const ids = JSON.parse(item.order.check.tableIds as string);
        if (Array.isArray(ids) && ids.length > 0) {
          tableName = tableMap.get(ids[0]) || "N/A";
        }
      } catch {}

      orderItemsMap.set(item.id, {
        name: item.menuItem?.name || "Ítem desconocido",
        quantity: item.quantity,
        tableName,
      });
    });
  }

  // ✅ Fetch Orders with items
  const ordersMap = new Map<
    string,
    { items: { name: string; quantity: number }[]; tableName?: string }
  >();
  if (orderIds.length > 0) {
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: {
          include: { menuItem: { select: { name: true } } },
        },
        check: {
          select: { tableIds: true },
        },
      },
    });

    // Fetch tables for table names
    const allTableIds = new Set<string>();
    orders.forEach((order) => {
      try {
        const ids = JSON.parse(order.check.tableIds as string);
        if (Array.isArray(ids)) {
          ids.forEach((id) => allTableIds.add(id));
        }
      } catch {}
    });

    const tables = await prisma.table.findMany({
      where: { id: { in: Array.from(allTableIds) } },
      select: { id: true, number: true, name: true },
    });
    const tableMap = new Map(
      tables.map((t) => [t.id, t.name || `Mesa ${t.number}`]),
    );

    orders.forEach((order) => {
      let tableName = "N/A";
      try {
        const ids = JSON.parse(order.check.tableIds as string);
        if (Array.isArray(ids) && ids.length > 0) {
          tableName = tableMap.get(ids[0]) || "N/A";
        }
      } catch {}

      const items = order.items.map((i) => ({
        name: i.menuItem?.name || "Ítem desconocido",
        quantity: i.quantity,
      }));
      ordersMap.set(order.id, { items, tableName });
    });
  }

  // ✅ Fetch Checks with orders and items
  const checksMap = new Map<
    string,
    { items: { name: string; quantity: number }[]; tableNames?: string }
  >();
  if (checkIds.length > 0) {
    const checks = await prisma.check.findMany({
      where: { id: { in: checkIds } },
      include: {
        orders: {
          include: {
            items: {
              include: { menuItem: { select: { name: true } } },
            },
          },
        },
        tables: { select: { number: true, name: true } },
      },
    });

    checks.forEach((check) => {
      const allItems: { name: string; quantity: number }[] = [];
      check.orders.forEach((order) => {
        order.items.forEach((item) => {
          allItems.push({
            name: item.menuItem?.name || "Ítem desconocido",
            quantity: item.quantity,
          });
        });
      });

      const tableNames =
        check.tables.length > 0
          ? check.tables.map((t) => t.name || `Mesa ${t.number}`).join(", ")
          : "N/A";

      checksMap.set(check.id, { items: allItems, tableNames });
    });
  }

  // ✅ Process voids with friendly type names and better fallbacks
  const processedVoidRecords = voidRecords.map((record) => {
    let targetType = "";
    let targetDetails = "";
    let totalVoided = 0;

    // ✅ Friendly type names
    const typeLabels: Record<string, string> = {
      ORDER_ITEM: "Item Anulado",
      ORDER: "Orden Anulada",
      CHECK: "Cuenta Anulada",
    };
    targetType = typeLabels[record.target] || record.target;

    if (record.target === "ORDER_ITEM") {
      const item = orderItemsMap.get(record.targetId);
      if (item) {
        targetDetails = `${item.name} (x${item.quantity}) — Mesa ${item.tableName}`;
        totalVoided = item.quantity;
      } else {
        // ✅ Fallback: Use note field (stored at void time) or reason
        targetDetails = record.note || record.reason || "Ítem no disponible";
        totalVoided = 0;
      }
    } else if (record.target === "ORDER") {
      const order = ordersMap.get(record.targetId);
      if (order && order.items.length > 0) {
        const itemSummary = order.items
          .slice(0, 3)
          .map((i) => `${i.name} (x${i.quantity})`)
          .join(", ");
        const remaining = order.items.length - 3;
        targetDetails = `${itemSummary}${remaining > 0 ? `... y ${remaining} más` : ""} — Mesa ${order.tableName}`;
        totalVoided = order.items.reduce((sum, i) => sum + i.quantity, 0);
      } else {
        targetDetails = record.note || record.reason || "Orden no disponible";
        totalVoided = 0;
      }
    } else if (record.target === "CHECK") {
      const check = checksMap.get(record.targetId);
      if (check && check.items.length > 0) {
        const itemSummary = check.items
          .slice(0, 3)
          .map((i) => `${i.name} (x${i.quantity})`)
          .join(", ");
        const remaining = check.items.length - 3;
        targetDetails = `${itemSummary}${remaining > 0 ? `... y ${remaining} más` : ""} — Mesas ${check.tableNames}`;
        totalVoided = check.items.reduce((sum, i) => sum + i.quantity, 0);
      } else {
        targetDetails = record.note || record.reason || "Cuenta no disponible";
        totalVoided = 0;
      }
    }

    return {
      id: record.id,
      voidedBy: record.voidedBy,
      target: targetType,
      targetDetails,
      totalVoided,
      reason: record.reason,
      createdAt: record.createdAt,
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
