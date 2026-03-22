// app/settings/reports/actions.ts
"use server";

import prisma from "@/lib/prisma";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const REPORT_TIMEZONE = "America/Lima";

function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return parseFloat(value.toString());
}

function limaLocalToUTC(dateStr: string, timeStr: string): Date {
  return fromZonedTime(`${dateStr}T${timeStr}`, REPORT_TIMEZONE);
}

function utcToLimaDisplay(date: Date | null | undefined): string {
  if (!date) return "—";
  const limaDate = toZonedTime(date, REPORT_TIMEZONE);
  return format(limaDate, "yyyy-MM-dd HH:mm");
}

function parseTurnData(json: any): TurnReportData[] {
  if (!json || typeof json !== "object") return [];

  return Object.entries(json).map(([name, data]: [string, any]) => ({
    name,
    start: typeof data?.start === "number" ? data.start : 0,
    end: typeof data?.end === "number" ? data.end : null,
    closedAt: typeof data?.closedAt === "string" ? data.closedAt : null,
    closedByName:
      typeof data?.closedByName === "string" ? data.closedByName : null,
    salesSnapshot: data?.salesSnapshot
      ? {
          cash: toNumber(data.salesSnapshot.cash),
          yape: toNumber(data.salesSnapshot.yape),
          total: toNumber(data.salesSnapshot.total),
          capturedAt: data.salesSnapshot.capturedAt,
          paymentCount: data.salesSnapshot.paymentCount,
        }
      : undefined,
    expectedCash:
      typeof data?.expectedCash === "number" ? data.expectedCash : null,
    variance: typeof data?.variance === "number" ? data.variance : null,
    note: typeof data?.note === "string" ? data.note : null,
  }));
}

export type TurnReportData = {
  name: string;
  start: number;
  end: number | null;
  closedAt: string | null;
  closedByName: string | null;
  salesSnapshot?: {
    cash: number;
    yape: number;
    total: number;
    capturedAt: string;
    paymentCount?: number;
  };
  expectedCash?: number | null;
  variance?: number | null;
  note?: string | null;
};

function getLimaDateRange(
  dateRange: string,
  rangeType: "day" | "week" | "month" | "all",
): { startDate: Date; endDate: Date } {
  if (rangeType === "all") {
    return {
      startDate: limaLocalToUTC("2020-01-01", "00:00:00"),
      endDate: new Date(),
    };
  }

  if (rangeType === "day") {
    return {
      startDate: limaLocalToUTC(dateRange, "00:00:00"),
      endDate: limaLocalToUTC(dateRange, "23:59:59"),
    };
  }

  if (rangeType === "week") {
    const inputLima = parseISO(dateRange);
    const weekStartLima = startOfWeek(inputLima, { weekStartsOn: 1 });
    weekStartLima.setHours(0, 0, 0, 0);
    const weekEndLima = endOfWeek(weekStartLima, { weekStartsOn: 1 });
    weekEndLima.setHours(23, 59, 59, 999);

    return {
      startDate: fromZonedTime(weekStartLima, REPORT_TIMEZONE),
      endDate: fromZonedTime(weekEndLima, REPORT_TIMEZONE),
    };
  }

  if (rangeType === "month") {
    const [year, month] = dateRange.split("-").map(Number);
    const startLima = startOfMonth(new Date(year, month - 1, 1));
    startLima.setHours(0, 0, 0, 0);
    const endLima = endOfMonth(startLima);
    endLima.setHours(23, 59, 59, 999);

    return {
      startDate: fromZonedTime(startLima, REPORT_TIMEZONE),
      endDate: fromZonedTime(endLima, REPORT_TIMEZONE),
    };
  }

  return {
    startDate: limaLocalToUTC("2020-01-01", "00:00:00"),
    endDate: new Date(),
  };
}

export async function getReportData({
  dateRange,
  rangeType,
  page = 1,
  checksPerPage = 10,
  categoryId,
}: {
  dateRange: string;
  rangeType: "day" | "week" | "month" | "all";
  page?: number;
  checksPerPage?: number;
  categoryId?: string;
}) {
  const { startDate, endDate } = getLimaDateRange(dateRange, rangeType);

  // === DAILY SUMMARY + TURNS (for day range) ===
  let dailySummary = null;
  let turns: TurnReportData[] = [];

  if (rangeType === "day") {
    const summaryDateUTC = limaLocalToUTC(dateRange, "00:00:00");
    summaryDateUTC.setHours(0, 0, 0, 0);

    dailySummary = await prisma.dailySummary.findUnique({
      where: { date: summaryDateUTC },
    });

    if (dailySummary?.turnData) {
      turns = parseTurnData(dailySummary.turnData);
    }
  } else {
    const dailySummaries = await prisma.dailySummary.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
    });

    for (const summary of dailySummaries) {
      if (summary.turnData) {
        const dayTurns = parseTurnData(summary.turnData);
        turns.push(...dayTurns);
      }
    }
  }

  // === SALES SUMMARY ===
  const payments = await prisma.payment.findMany({
    where: {
      check: {
        status: "CLOSED",
        closedAt: { gte: startDate, lte: endDate },
      },
    },
  });

  const totalCash = payments
    .filter((p) => p.method === "CASH" || p.method === "MIXED")
    .reduce(
      (sum, p) =>
        sum + (p.cashAmount ? toNumber(p.cashAmount) : toNumber(p.amount)),
      0,
    );

  const totalYape = payments
    .filter((p) => p.method === "MOBILE_PAY" || p.method === "MIXED")
    .reduce((sum, p) => sum + (p.yapeAmount ? toNumber(p.yapeAmount) : 0), 0);

  const totalOverall = payments.reduce((sum, p) => sum + toNumber(p.amount), 0);

  // === DAILY CASH FLOW (for day range) ===
  let dailyCashFlow = null;
  if (rangeType === "day" && dailySummary) {
    const dayPayments = await prisma.payment.findMany({
      where: {
        check: {
          status: "CLOSED",
          closedAt: { gte: startDate, lte: endDate },
        },
        method: { in: ["CASH", "MIXED"] },
      },
    });

    const cashSalesForDay = dayPayments.reduce(
      (sum, p) =>
        sum + (p.cashAmount ? toNumber(p.cashAmount) : toNumber(p.amount)),
      0,
    );

    dailyCashFlow = {
      openingCash: toNumber(dailySummary.startingCash),
      cashSalesForDay,
      endingCash: toNumber(dailySummary.endingCash),
    };
  }

  // === SPENDINGS ===
  const storageTransactions = await prisma.storageTransaction.findMany({
    where: {
      type: { in: ["PURCHASE", "WASTE"] },
      createdAt: { gte: startDate, lte: endDate },
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

  // === ITEMS SOLD ===
  const itemGroups = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      order: {
        check: {
          status: "CLOSED",
          closedAt: { gte: startDate, lte: endDate },
        },
      },
      menuItem: categoryId ? { categoryId } : undefined,
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
  });

  const menuItemIds = itemGroups.map((g) => g.menuItemId);
  let menuItemsMap = new Map<string, any>();
  if (menuItemIds.length > 0) {
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: { category: true },
    });
    menuItemsMap = new Map(
      menuItems.map((m) => [
        m.id,
        {
          ...m,
          price: toNumber(m.price),
        },
      ]),
    );
  }

  const allItemsSold = itemGroups.map((group) => ({
    menuItem: menuItemsMap.get(group.menuItemId),
    totalQuantity: group._sum.quantity || 0,
  }));

  // === CHECKS ===
  const skip = (page - 1) * checksPerPage;

  const checks = await prisma.check.findMany({
    where: {
      status: "CLOSED",
      closedAt: { gte: startDate, lte: endDate },
    },
    include: {
      orders: {
        include: {
          items: {
            include: {
              menuItem: {
                include: { category: true },
              },
            },
          },
        },
      },
      payments: true,
    },
    orderBy: { closedAt: "desc" },
    take: checksPerPage,
    skip,
  });

  // Fetch table info
  const allCheckTableIds = new Set<string>();
  checks.forEach((check) => {
    try {
      const ids = JSON.parse(check.tableIds);
      if (Array.isArray(ids)) {
        ids.forEach((id) => allCheckTableIds.add(id));
      }
    } catch (e) {
      console.error("Invalid tableIds JSON:", check.tableIds, e);
    }
  });

  let tableMap = new Map<string, { number: number; name: string | null }>();
  if (allCheckTableIds.size > 0) {
    const tables = await prisma.table.findMany({
      where: { id: { in: Array.from(allCheckTableIds) } },
      select: { id: true, number: true, name: true },
    });
    tableMap = new Map(
      tables.map((t) => [t.id, { number: t.number, name: t.name }]),
    );
  }

  const paymentMethodMap: Record<string, string> = {
    CASH: "Efectivo",
    MOBILE_PAY: "Yape",
    MIXED: "Mixto",
  };

  const serializedChecks = checks.map((check) => {
    let tableInfo: { number: number; name: string | null }[] = [];
    try {
      const ids = JSON.parse(check.tableIds);
      if (Array.isArray(ids)) {
        tableInfo = ids
          .map((id) => tableMap.get(id))
          .filter((info) => info !== undefined) as {
          number: number;
          name: string | null;
        }[];
      }
    } catch (e) {
      console.error("Invalid tableIds JSON during mapping:", check.tableIds, e);
    }

    let totalItemsQuantity = 0;
    const itemNames: string[] = [];
    check.orders.forEach((order) => {
      order.items.forEach((item) => {
        totalItemsQuantity += item.quantity;
        itemNames.push(item.menuItem.name);
      });
    });

    const formattedDate = utcToLimaDisplay(check.closedAt);

    const paymentMethodsUsed = Array.from(
      new Set(
        check.payments.map((p) => paymentMethodMap[p.method] || p.method),
      ),
    );

    return {
      id: check.id,
      tableNames: tableInfo
        .map((info) => info.name || `Mesa ${info.number}`)
        .join(", "),
      closedAt: formattedDate,
      itemNames,
      totalItemsQuantity,
      paymentMethods: paymentMethodsUsed.join(", "),
      total: toNumber(check.total),
    };
  });

  const totalChecks = await prisma.check.count({
    where: {
      status: "CLOSED",
      closedAt: { gte: startDate, lte: endDate },
    },
  });

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const turnTotals = turns.reduce(
    (acc, turn) => {
      acc.startSum += turn.start;
      acc.endSum += turn.end || 0;
      acc.salesSum += turn.salesSnapshot?.total || 0;
      acc.varianceSum += turn.variance || 0;
      return acc;
    },
    { startSum: 0, endSum: 0, salesSum: 0, varianceSum: 0 },
  );

  return {
    sales: {
      totalCash: toNumber(totalCash),
      totalYape: toNumber(totalYape),
      totalOverall: toNumber(totalOverall),
    },
    spendings: {
      total: totalSpendings,
      netProfit,
      marginPercent,
    },
    itemsSold: allItemsSold,
    checks: serializedChecks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalChecks / checksPerPage),
      totalChecks,
    },
    categories,
    dateRange,
    rangeType,
    dailyCashFlow,
    dailySummary: dailySummary
      ? {
          startingCash: toNumber(dailySummary.startingCash),
          endingCash: toNumber(dailySummary.endingCash),
          status: dailySummary.status,
        }
      : null,
    turns,
    turnTotals: turns.length > 0 ? turnTotals : null,
  };
}
