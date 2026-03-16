// app/dashboard/actions.ts
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

export async function openRestaurant(startingCash: number) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let existingSummary = await prisma.dailySummary.findUnique({
    where: { date: today },
  });

  if (existingSummary) {
    if (existingSummary.status === "OPEN") {
      throw new Error("El restaurante ya está abierto para hoy");
    }
    await prisma.dailySummary.update({
      where: { id: existingSummary.id },
      data: {
        startingCash,
        totalCash: 0,
        totalYape: 0,
        endingCash: startingCash,
        status: "OPEN",
        openedById: user.id,
        openedAt: new Date(),
        closedById: null,
        closedAt: null,
      },
    });
  } else {
    await prisma.dailySummary.create({
      data: {
        date: today,
        startingCash,
        totalCash: 0,
        totalYape: 0,
        endingCash: startingCash,
        openedById: user.id,
        status: "OPEN",
      },
    });
  }

  revalidatePath("/dashboard");
}

export async function fetchDashboardData() {
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

  // === PAYMENTS ===
  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: today, lte: tomorrow },
      check: {
        status: "CLOSED",
      },
    },
    select: {
      id: true,
      method: true,
      amount: true,
      cashAmount: true,
      yapeAmount: true,
      check: {
        select: {
          id: true,
          total: true,
          closedAt: true,
          openedAt: true,
        },
      },
    },
  });

  let totalCash = 0;
  let totalYape = 0;

  for (const p of payments) {
    const cash = toNumber(p.cashAmount || 0);
    const yape = toNumber(p.yapeAmount || 0);
    totalCash += cash;
    totalYape += yape;
  }

  const totalOverall = totalCash + totalYape;

  // === SPENDINGS ===
  const storageTransactions = await prisma.storageTransaction.findMany({
    where: {
      type: { in: ["PURCHASE", "WASTE"] },
      createdAt: { gte: today, lte: tomorrow },
      storageItem: { costPerUnit: { not: null } },
    },
    include: {
      storageItem: {
        select: { costPerUnit: true, name: true },
      },
    },
  });

  const totalSpendings = storageTransactions.reduce((sum, t) => {
    const cost = toNumber(t.storageItem.costPerUnit || 0);
    const qty =
      t.quantityChange > 0 ? t.quantityChange : Math.abs(t.quantityChange);
    return sum + qty * cost;
  }, 0);

  const netProfit = totalOverall - totalSpendings;
  const marginPercent = totalOverall > 0 ? (netProfit / totalOverall) * 100 : 0;

  // === RECENT ORDERS - Enhanced with better item fetching ===
  const recentOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: today, lte: tomorrow },
      check: { status: "CLOSED" },
    },
    include: {
      items: {
        include: {
          menuItem: {
            include: { category: true },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 3, // Get first 3 items for display
      },
      check: {
        select: {
          tableIds: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const allTableIds = new Set<string>();
  recentOrders.forEach((order) => {
    try {
      const ids = JSON.parse(order.check.tableIds as string);
      if (Array.isArray(ids)) {
        ids.forEach((id) => allTableIds.add(id));
      }
    } catch (e) {
      console.error("Invalid tableIds:", order.check.tableIds);
    }
  });

  const tables = await prisma.table.findMany({
    where: { id: { in: Array.from(allTableIds) } },
    select: { id: true, name: true, number: true },
  });
  const tableMap = new Map(
    tables.map((t) => [t.id, t.name || `Mesa ${t.number}`]),
  );

  const recentOrdersWithTableNames = recentOrders.map((order) => {
    try {
      const ids = JSON.parse(order.check.tableIds as string);
      const tableName =
        ids.length > 0 ? tableMap.get(ids[0]) || "Mesa" : "Mesa";

      // ✅ Better item name extraction
      const itemNames = order.items
        .filter((item) => item.menuItem?.name)
        .map((item) => `${item.menuItem.name} (x${item.quantity})`);

      return {
        ...order,
        tableName,
        firstItemName:
          itemNames.length > 0 ? itemNames.join(", ") : "Ítem desconocido",
      };
    } catch (e) {
      return {
        ...order,
        tableName: "Mesa",
        firstItemName: "Ítem desconocido",
      };
    }
  });

  // === RECENT VOIDS - Bulletproof with fallback to VoidRecord.note ===
  const recentVoids = await prisma.voidRecord.findMany({
    where: { createdAt: { gte: today, lte: tomorrow } },
    include: { voidedBy: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Helper function with better error handling
  async function getVoidTargetDetails(record: any) {
    try {
      // ✅ First check if we have note info (stored at void time)
      if (record.note && record.note.includes("Mesas:")) {
        // Parse note format: "Mesas: 3, 5 | Total: S/45.50"
        return record.note;
      }

      if (record.target === "ORDER_ITEM") {
        const item = await prisma.orderItem.findUnique({
          where: { id: record.targetId },
          include: {
            menuItem: { select: { name: true } },
            order: {
              include: {
                check: {
                  include: {
                    tables: { select: { number: true } },
                  },
                },
              },
            },
          },
        });

        if (!item || !item.menuItem) {
          // ✅ Fallback: Use void record info
          return `Item anulado — ${record.reason || "Sin motivo"}`;
        }

        let tableNumbers = "N/A";
        if (item.order.check.tables && item.order.check.tables.length > 0) {
          tableNumbers = item.order.check.tables
            .map((t: any) => t.number)
            .join(", ");
        } else if (item.order.check.tableIds) {
          try {
            const tableIdArray = JSON.parse(
              item.order.check.tableIds,
            ) as string[];
            const tables = await prisma.table.findMany({
              where: { id: { in: tableIdArray } },
              select: { number: true },
            });
            tableNumbers = tables.map((t: any) => t.number).join(", ") || "N/A";
          } catch {
            tableNumbers = "N/A";
          }
        }

        return `${item.menuItem.name} (x${item.quantity}) — Mesa ${tableNumbers}`;
      }

      if (record.target === "ORDER") {
        const order = await prisma.order.findUnique({
          where: { id: record.targetId },
          include: {
            check: {
              include: {
                tables: { select: { number: true } },
              },
            },
          },
        });

        if (!order) {
          return `Orden anulada — ${record.reason || "Sin motivo"}`;
        }

        let tableNumbers = "N/A";
        if (order.check.tables && order.check.tables.length > 0) {
          tableNumbers = order.check.tables
            .map((t: any) => t.number)
            .join(", ");
        } else if (order.check.tableIds) {
          try {
            const tableIdArray = JSON.parse(order.check.tableIds) as string[];
            const tables = await prisma.table.findMany({
              where: { id: { in: tableIdArray } },
              select: { number: true },
            });
            tableNumbers = tables.map((t: any) => t.number).join(", ") || "N/A";
          } catch {
            tableNumbers = "N/A";
          }
        }

        return `Orden — Mesa ${tableNumbers}`;
      }

      if (record.target === "CHECK") {
        const check = await prisma.check.findUnique({
          where: { id: record.targetId },
          include: {
            tables: { select: { number: true } },
          },
        });

        if (!check) {
          return `Cuenta anulada — ${record.reason || "Sin motivo"}`;
        }

        let tableNumbers = "N/A";
        if (check.tables && check.tables.length > 0) {
          tableNumbers = check.tables.map((t: any) => t.number).join(", ");
        } else if (check.tableIds) {
          try {
            const tableIdArray = JSON.parse(check.tableIds) as string[];
            const tables = await prisma.table.findMany({
              where: { id: { in: tableIdArray } },
              select: { number: true },
            });
            tableNumbers = tables.map((t: any) => t.number).join(", ") || "N/A";
          } catch {
            tableNumbers = "N/A";
          }
        }

        return `Cuenta — Mesas ${tableNumbers} (S/${Number(check.total).toFixed(2)})`;
      }

      return `${record.target} — ${record.reason || "Sin motivo"}`;
    } catch (error) {
      console.error("Error fetching void details:", error);
      return `${record.target} — ${record.reason || "Error cargando"}`;
    }
  }

  const recentVoidsProcessed = await Promise.all(
    recentVoids.map(async (record) => {
      const targetDetails = await getVoidTargetDetails(record);
      return {
        ...record,
        targetDetails,
      };
    }),
  );

  // === TOP ITEMS ===
  const topItems = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      order: {
        createdAt: { gte: today, lte: tomorrow },
        check: { status: "CLOSED" },
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const menuItemIds = topItems.map((t) => t.menuItemId);
  let menuItemsMap = new Map();
  if (menuItemIds.length > 0) {
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: { category: true },
    });
    menuItemsMap = new Map(menuItems.map((m) => [m.id, m]));
  }

  const topItemsWithDetails = topItems.map((t) => ({
    menuItem: menuItemsMap.get(t.menuItemId),
    totalQuantity: t._sum.quantity || 0,
  }));

  return {
    dailySummary,
    payments: {
      totalCash,
      totalYape,
      totalOverall,
      cashPercentage: totalOverall > 0 ? (totalCash / totalOverall) * 100 : 0,
      yapePercentage: totalOverall > 0 ? (totalYape / totalOverall) * 100 : 0,
    },
    spendings: {
      total: totalSpendings,
      netProfit,
      marginPercent,
    },
    recentOrders: recentOrdersWithTableNames,
    recentVoids: recentVoidsProcessed,
    topItems: topItemsWithDetails,
    date: today,
  };
}
