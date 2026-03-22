// app/dashboard/close/actions.ts
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

  const voidRecords = await prisma.voidRecord.findMany({
    where: { createdAt: { gte: today, lte: tomorrow } },
    include: {
      voidedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Collect IDs for batch fetching
  const orderIds: string[] = [];
  const orderItemIds: string[] = [];
  const checkIds: string[] = [];

  voidRecords.forEach((record) => {
    if (record.target === "ORDER") orderIds.push(record.targetId);
    else if (record.target === "ORDER_ITEM") orderItemIds.push(record.targetId);
    else if (record.target === "CHECK") checkIds.push(record.targetId);
  });

  // === Fetch OrderItems with metadata ===
  const orderItemsMap = new Map<
    string,
    {
      name: string;
      quantity: number;
      tableName?: string;
      price?: number;
      category?: string;
    }
  >();
  if (orderItemIds.length > 0) {
    const items = await prisma.orderItem.findMany({
      where: { id: { in: orderItemIds } },
      include: {
        menuItem: { select: { name: true, category: true, price: true } },
        order: {
          include: {
            check: { select: { tableIds: true } },
          },
        },
      },
    });

    // Fetch tables for table names
    const allTableIds = new Set<string>();
    items.forEach((item) => {
      try {
        const ids = JSON.parse(item.order.check.tableIds as string);
        if (Array.isArray(ids)) ids.forEach((id) => allTableIds.add(id));
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
        price: item.menuItem ? toNumber(item.menuItem.price) : undefined,
        category: item.menuItem?.category?.name || undefined,
      });
    });
  }

  // === Fetch Orders with items ===
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
        check: { select: { tableIds: true } },
      },
    });

    const allTableIds = new Set<string>();
    orders.forEach((order) => {
      try {
        const ids = JSON.parse(order.check.tableIds as string);
        if (Array.isArray(ids)) ids.forEach((id) => allTableIds.add(id));
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

  // === ✅ Fetch Checks - FIXED: Use tableIds field, not tables relation ===
  const checksMap = new Map<
    string,
    {
      items: { name: string; quantity: number }[];
      tableNames?: string;
      total?: number;
      itemCount?: number;
    }
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
        // ✅ Don't include tables relation (it's disconnected after void)
      },
    });

    // ✅ Fetch table numbers from tableIds field (persists after void)
    const allCheckTableIds = new Set<string>();
    checks.forEach((check) => {
      try {
        const ids = JSON.parse(check.tableIds as string);
        if (Array.isArray(ids)) ids.forEach((id) => allCheckTableIds.add(id));
      } catch {}
    });

    const tables = await prisma.table.findMany({
      where: { id: { in: Array.from(allCheckTableIds) } },
      select: { id: true, number: true, name: true },
    });
    const tableMap = new Map(
      tables.map((t) => [t.id, t.name || `Mesa ${t.number}`]),
    );

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

      // ✅ Get table names from tableIds field (not tables relation)
      let tableNames = "N/A";
      try {
        const ids = JSON.parse(check.tableIds as string);
        if (Array.isArray(ids) && ids.length > 0) {
          const names = ids
            .map((id) => tableMap.get(id))
            .filter(Boolean)
            .map((t: any) => t!.name || `Mesa ${t!.name}`);
          tableNames = names.join(", ") || "N/A";
        }
      } catch {
        tableNames = "N/A";
      }

      checksMap.set(check.id, {
        items: allItems,
        tableNames,
        total: check.total ? toNumber(check.total) : 0,
        itemCount: allItems.length,
      });
    });
  }

  // === Process voids with friendly names and fallbacks ===
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

    if (record.target === "ORDER_ITEM") {
      // Try metadata first
      if (metadata?.menuItem) {
        const tableInfo = metadata.table
          ? `Mesa ${metadata.table.number}${
              metadata.table.name ? ` (${metadata.table.name})` : ""
            }`
          : "Mesa N/A";
        const qty = metadata.quantities?.voided || 1;
        targetDetails = `${metadata.menuItem.name} ×${qty} — ${tableInfo}`;
        totalVoided = qty;
      } else {
        // Fallback to fetched data
        const item = orderItemsMap.get(record.targetId);
        if (item) {
          targetDetails = `${item.name} (x${item.quantity}) — Mesa ${
            item.tableName || "N/A"
          }`;
          totalVoided = item.quantity;
        } else {
          // Final fallback: use note/reason
          targetDetails = record.note || record.reason || "Ítem no disponible";
          totalVoided = 0;
        }
      }
    } else if (record.target === "ORDER") {
      if (metadata?.tables?.length) {
        const tableNames = metadata.tables
          .map((t: any) => `Mesa ${t.number}${t.name ? ` (${t.name})` : ""}`)
          .join(", ");
        targetDetails = `Orden — Mesa ${tableNames}`;
        totalVoided = 1;
      } else {
        const order = ordersMap.get(record.targetId);
        if (order && order.items.length > 0) {
          const itemSummary = order.items
            .slice(0, 3)
            .map((i) => `${i.name} (x${i.quantity})`)
            .join(", ");
          const remaining = order.items.length - 3;
          targetDetails = `${itemSummary}${
            remaining > 0 ? `... y ${remaining} más` : ""
          } — Mesa ${order.tableName || "N/A"}`;
          totalVoided = order.items.reduce((sum, i) => sum + i.quantity, 0);
        } else {
          targetDetails = record.note || record.reason || "Orden no disponible";
          totalVoided = 0;
        }
      }
    } else if (record.target === "CHECK") {
      if (record.note) {

        const parts = record.note.split("•").map((p: string) => p.trim());
        if (parts.length >= 2) {
          targetDetails = `${parts[0]} • ${parts[1]}`; // "Cuenta — Mesas X • Item1 ×Q, Item2 ×Q"
        } else {
          targetDetails = record.note;
        }
        totalVoided = metadata?.check?.itemCount || 0;

        // ✅ PRIORITY 2: Use metadata.items array (structured fallback)
      } else if (metadata?.items?.length > 0 && metadata?.tables?.length > 0) {
        const itemSummary = metadata.items
          .slice(0, 4)
          .map((i: any) => `${i.name} ×${i.quantity}`)
          .join(", ");
        const remaining = metadata.items.length - 4;
        const tableNames = metadata.tables
          .map((t: any) => `${t.number}${t.name ? ` (${t.name})` : ""}`)
          .join(", ");

        targetDetails = `Cuenta — Mesas ${tableNames} • ${itemSummary}${remaining > 0 ? `... y ${remaining} más` : ""}`;
        totalVoided = metadata.items.reduce(
          (sum: number, i: any) => sum + (i.quantity || 0),
          0,
        );

      } else {
        const check = checksMap.get(record.targetId);
        if (check && check.items.length > 0) {
          const itemSummary = check.items
            .slice(0, 4)
            .map((i) => `${i.name} ×${i.quantity}`)
            .join(", ");
          const remaining = check.items.length - 4;
          targetDetails = `Cuenta — Mesas ${check.tableNames || "N/A"} • ${itemSummary}${remaining > 0 ? `... y ${remaining} más` : ""}`;
          totalVoided = check.items.reduce((sum, i) => sum + i.quantity, 0);
        } else {
          targetDetails = record.reason || "Cuenta anulada (sin detalles)";
          totalVoided = 0;
        }
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

  const turns = parseTurnData(dailySummary?.turnData);

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
    turns,
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

function parseTurnData(json: any) {
  if (!json || typeof json !== "object") return [];
  return Object.entries(json).map(([name, data]: [string, any]) => ({
    name,
    start: typeof data?.start === "number" ? data.start : 0,
    end: typeof data?.end === "number" ? data.end : null,
    closedAt: data?.closedAt || null,
    closedByName: data?.closedByName || null,
    salesSnapshot: data?.salesSnapshot || null,
    expectedCash:
      typeof data?.expectedCash === "number" ? data.expectedCash : null,
    variance: typeof data?.variance === "number" ? data.variance : null,
    note: data?.note || null,
  }));
}
