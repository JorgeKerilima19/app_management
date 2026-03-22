// app/dashboard/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type TurnData = {
  name: string;
  start: number;
  end: number | null;
  closedAt: string | null;
  closedBy: string | null;
  closedByName?: string;
  salesSnapshot?: {
    cash: number;
    yape: number;
    total: number;
    capturedAt: string;
    paymentCount?: number;
  };
  expectedCash?: number;
  variance?: number;
  note?: string;
};

export type DashboardData = {
  dailySummary: {
    id: string;
    date: Date;
    startingCash: number;
    totalCash: number;
    totalYape: number;
    endingCash: number;
    status: "OPEN" | "CLOSED";
    openedAt: Date;
    closedAt: Date | null;
    openedById: string;
    closedById: string | null;
    createdAt: Date;
    updatedAt: Date;
    turnData: Record<string, TurnData> | null;
    activeTurn: string | null;
  } | null;
  turnData: TurnData[];
  activeTurn: string | null;
  payments: {
    totalCash: number;
    totalYape: number;
    totalOverall: number;
    cashPercentage: number;
    yapePercentage: number;
  };
  spendings: {
    total: number;
    netProfit: number;
    marginPercent: number;
  };
  recentOrders: Array<{
    id: string;
    tableName: string;
    firstItemName: string;
    createdAt: Date;
    items: Array<{
      menuItem?: { name: string };
      quantity: number;
    }>;
  }>;
  recentVoids: Array<{
    id: string;
    targetDetails: string;
    voidedBy?: { name: string; role: string };
    reason: string;
    createdAt: Date;
  }>;
  topItems: Array<{
    menuItem?: {
      name: string;
      category?: { name: string };
    };
    totalQuantity: number;
  }>;
  date: Date;
};

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

function parseTurnData(json: any): Record<string, TurnData> {
  if (!json || typeof json !== "object") return {};

  const result: Record<string, TurnData> = {};

  for (const [key, value] of Object.entries(json)) {
    const v = value as any;
    result[key] = {
      name: key,
      start: typeof v?.start === "number" ? v.start : 0,
      end: typeof v?.end === "number" ? v.end : null,
      closedAt: typeof v?.closedAt === "string" ? v.closedAt : null,
      closedBy: typeof v?.closedBy === "string" ? v.closedBy : null,
      closedByName:
        typeof v?.closedByName === "string" ? v.closedByName : undefined,
      salesSnapshot: v?.salesSnapshot || undefined,
      expectedCash:
        typeof v?.expectedCash === "number" ? v.expectedCash : undefined,
      variance: typeof v?.variance === "number" ? v.variance : undefined,
      note: typeof v?.note === "string" ? v.note : undefined,
    };
  }

  return result;
}

export async function fetchDashboardData(): Promise<DashboardData> {
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

  // === RECENT ORDERS ===
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
        take: 3,
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

      const itemNames = order.items
        .filter((item) => item.menuItem?.name)
        .map((item) => `${item.menuItem.name} (x${item.quantity})`);

      return {
        id: order.id,
        tableName,
        firstItemName:
          itemNames.length > 0 ? itemNames.join(", ") : "Ítem desconocido",
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          menuItem: item.menuItem ? { name: item.menuItem.name } : undefined,
          quantity: item.quantity,
        })),
      };
    } catch (e) {
      return {
        id: order.id,
        tableName: "Mesa",
        firstItemName: "Ítem desconocido",
        createdAt: order.createdAt,
        items: [],
      };
    }
  });

  // === RECENT VOIDS ===
  const recentVoids = await prisma.voidRecord.findMany({
    where: { createdAt: { gte: today, lte: tomorrow } },
    include: { voidedBy: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  async function getVoidTargetDetails(record: any) {
    try {
      if (record.note && record.note.includes("Mesas:")) {
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
        id: record.id,
        targetDetails,
        voidedBy: record.voidedBy
          ? { name: record.voidedBy.name, role: record.voidedBy.role }
          : undefined,
        reason: record.reason || "",
        createdAt: record.createdAt,
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
  let menuItemsMap = new Map<
    string,
    { name: string; category?: { name: string } }
  >();
  if (menuItemIds.length > 0) {
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: { category: true },
    });
    menuItemsMap = new Map(
      menuItems.map((m) => [
        m.id,
        {
          name: m.name,
          category: m.category ? { name: m.category.name } : undefined,
        },
      ]),
    );
  }

  const topItemsWithDetails = topItems.map((t) => ({
    menuItem: menuItemsMap.get(t.menuItemId),
    totalQuantity: t._sum.quantity || 0,
  }));

  // === TURN DATA (Safe JSON parsing) ===
  const turnDataParsed = parseTurnData(dailySummary?.turnData);
  const turnDataArray: TurnData[] = Object.values(turnDataParsed);
  const activeTurn: string | null = dailySummary?.activeTurn ?? null;

  // === RETURN TYPED DATA ===
  return {
    dailySummary: dailySummary
      ? {
          id: dailySummary.id,
          date: dailySummary.date,
          startingCash: toNumber(dailySummary.startingCash),
          totalCash: toNumber(dailySummary.totalCash),
          totalYape: toNumber(dailySummary.totalYape),
          endingCash: toNumber(dailySummary.endingCash),
          status: dailySummary.status as "OPEN" | "CLOSED",
          openedAt: dailySummary.openedAt,
          closedAt: dailySummary.closedAt,
          openedById: dailySummary.openedById,
          closedById: dailySummary.closedById,
          createdAt: dailySummary.createdAt,
          updatedAt: dailySummary.updatedAt,
          turnData: turnDataParsed,
          activeTurn: dailySummary.activeTurn ?? null,
        }
      : null,
    turnData: turnDataArray,
    activeTurn,
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

export async function openTurn(startingCash: number, turnName: string) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const summary = await prisma.dailySummary.findUnique({
    where: { date: today },
  });

  if (!summary) {
    throw new Error("Primero debe abrir el restaurante");
  }

  if (summary.status === "CLOSED") {
    throw new Error("El día ya está cerrado");
  }

  const existingTurnData = parseTurnData(summary.turnData);

  if (existingTurnData[turnName]) {
    throw new Error(`El turno ${turnName} ya existe`);
  }

  await prisma.dailySummary.update({
    where: { id: summary.id },
    data: {
      turnData: {
        ...existingTurnData,
        [turnName]: {
          start: startingCash,
          end: null,
          closedAt: null,
          closedBy: null,
          salesSnapshot: {
            cash: 0,
            yape: 0,
            total: 0,
            capturedAt: new Date().toISOString(),
          },
        },
      },
      activeTurn: turnName,
      startingCash: startingCash,
    },
  });

  revalidatePath("/dashboard");
}

export async function closeTurn(
  turnName: string,
  declaredCash: number,
  note?: string,
) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const summary = await prisma.dailySummary.findUnique({
    where: { date: today },
  });

  if (!summary) {
    throw new Error("No hay resumen del día");
  }

  // ✅ Parse turnData with our helper for type safety
  const turnData = parseTurnData(summary.turnData);
  const turn = turnData[turnName];

  if (!turn) {
    throw new Error(`Turno ${turnName} no encontrado`);
  }

  if (turn.end !== null) {
    throw new Error(`El turno ${turnName} ya está cerrado`);
  }

  // === CAPTURE SALES SNAPSHOT ===
  // Find the last closed turn's timestamp to filter payments from that point
  const closedTurns = Object.values(turnData).filter(
    (t) => t.closedAt !== null,
  );

  const lastTurnClose =
    closedTurns.length > 0
      ? closedTurns.sort(
          (a, b) =>
            new Date(b.closedAt!).getTime() - new Date(a.closedAt!).getTime(),
        )[0]?.closedAt
      : null;

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: lastTurnClose ? new Date(lastTurnClose) : today,
        lte: new Date(),
      },
      check: {
        status: "CLOSED",
      },
    },
    select: {
      id: true,
      method: true,
      cashAmount: true,
      yapeAmount: true,
      amount: true,
    },
  });

  let cashSales = 0;
  let yapeSales = 0;

  for (const p of payments) {
    cashSales += toNumber(p.cashAmount || 0);
    yapeSales += toNumber(p.yapeAmount || 0);
  }

  const totalSales = cashSales + yapeSales;
  const expectedCash = turn.start + cashSales;
  const variance = declaredCash - expectedCash;

  // === UPDATE TURN DATA ===
  turnData[turnName] = {
    ...turn,
    end: declaredCash,
    closedAt: new Date().toISOString(),
    closedBy: user.id,
    closedByName: user.name,
    salesSnapshot: {
      cash: cashSales,
      yape: yapeSales,
      total: totalSales,
      capturedAt: new Date().toISOString(),
      paymentCount: payments.length,
    },
    expectedCash,
    variance,
    note: note || "",
  };

  // Find next turn name (turn1, turn2, turn3...)
  const turnNumbers = Object.keys(turnData)
    .map((k) => parseInt(k.replace("turn", "")))
    .filter((n) => !isNaN(n));
  const nextTurnNumber = Math.max(...turnNumbers, 0) + 1;

  await prisma.dailySummary.update({
    where: { id: summary.id },
    data: {
      turnData: turnData as any,
      activeTurn: null,
      endingCash: declaredCash,
      totalCash: toNumber(summary.totalCash) + cashSales,
      totalYape: toNumber(summary.totalYape) + yapeSales,
    },
  });

  revalidatePath("/dashboard");

  return {
    success: true,
    turnName,
    declaredCash,
    expectedCash,
    variance,
    nextTurnName: `turn${nextTurnNumber}`,
    nextTurnStartingCash: declaredCash,
  };
}
