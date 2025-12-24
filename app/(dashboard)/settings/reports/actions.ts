// app/(dashboard)/settings/reports/actions.ts
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

function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return parseFloat(value.toString());
}

export async function getReportData({
  dateRange,
  rangeType,
  page = 1,
  ordersPerPage = 10,
  categoryId,
}: {
  dateRange: string;
  rangeType: "day" | "week" | "month" | "all";
  page?: number;
  ordersPerPage?: number;
  categoryId?: string;
}) {
  let startDate: Date;
  let endDate: Date;

  if (rangeType === "all") {
    startDate = new Date("2020-01-01");
    endDate = new Date();
  } else if (rangeType === "day") {
    startDate = new Date(dateRange);
    endDate = new Date(dateRange);
    endDate.setHours(23, 59, 59, 999);
  } else if (rangeType === "week") {
    const weekStart = startOfWeek(parseISO(dateRange), { weekStartsOn: 1 });
    startDate = weekStart;
    endDate = endOfWeek(weekStart, { weekStartsOn: 1 });
  } else if (rangeType === "month") {
    startDate = startOfMonth(parseISO(`${dateRange}-01`));
    endDate = endOfMonth(startDate);
  } else {
    startDate = new Date("2020-01-01");
    endDate = new Date();
  }

  // === SALES SUMMARY ===
  let totalCash = 0;
  let totalYape = 0;
  let totalOverall = 0;

  if (rangeType === "day") {
    const summary = await prisma.paymentSummary.findUnique({
      where: { date: startDate },
    });
    totalCash = summary?.cashTotal ? toNumber(summary.cashTotal) : 0;
    totalYape = summary?.yapeTotal ? toNumber(summary.yapeTotal) : 0;
    totalOverall = summary?.total ? toNumber(summary.total) : 0;
  } else {
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });
    totalCash = payments
      .filter((p) => p.method === "CASH" || p.method === "MIXED")
      .reduce(
        (sum, p) =>
          sum + (p.cashAmount ? toNumber(p.cashAmount) : toNumber(p.amount)),
        0
      );

    totalYape = payments
      .filter((p) => p.method === "MOBILE_PAY" || p.method === "MIXED")
      .reduce(
        (sum, p) => sum + (p.mobilePayAmount ? toNumber(p.mobilePayAmount) : 0),
        0
      );

    totalOverall = payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  }

  // === ALL ITEMS SOLD ===
  const itemGroups = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      order: {
        check: {
          closedAt: { gte: startDate, lte: endDate },
        },
      },
      menuItem: categoryId ? { categoryId } : undefined,
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: { quantity: "desc" },
    },
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
      ])
    );
  }

  const allItemsSold = itemGroups.map((group) => ({
    menuItem: menuItemsMap.get(group.menuItemId),
    totalQuantity: group._sum.quantity || 0,
  }));

  // === ALL ORDERS ===
  const skip = (page - 1) * ordersPerPage;

  const orders = await prisma.order.findMany({
    where: {
      check: {
        closedAt: { gte: startDate, lte: endDate },
      },
    },
    include: {
      check: true, // ← We'll process tableIds manually
      items: {
        include: {
          menuItem: {
            include: { category: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: ordersPerPage,
    skip,
  });

  // ✅ Extract table numbers from check.tableIds (JSON string)
  const allTableIds = new Set<string>();
  orders.forEach((order) => {
    try {
      const ids = JSON.parse(order.check.tableIds);
      if (Array.isArray(ids)) {
        ids.forEach((id) => allTableIds.add(id));
      }
    } catch (e) {
      console.error("Invalid tableIds:", order.check.tableIds);
    }
  });

  // Fetch tables
  const tableMap = new Map<string, number>();
  if (allTableIds.size > 0) {
    const tables = await prisma.table.findMany({
      where: { id: { in: Array.from(allTableIds) } },
      select: { id: true, number: true },
    });
    for (const table of tables) {
      tableMap.set(table.id, table.number);
    }
  }

  // Serialize orders with table numbers
  const serializedOrders = orders.map((order) => {
    let tableNumbers: number[] = [];
    try {
      const ids = JSON.parse(order.check.tableIds);
      if (Array.isArray(ids)) {
        tableNumbers = ids
          .map((id) => tableMap.get(id))
          .filter((num): num is number => num !== undefined);
      }
    } catch (e) {
      // skip
    }

    return {
      ...order,
      tableNumbers,
      // ✅ Serialize check object
      check: {
        ...order.check,
        subtotal: toNumber(order.check.subtotal),
        tax: toNumber(order.check.tax),
        discount: toNumber(order.check.discount),
        total: toNumber(order.check.total),
      },
      items: order.items.map((item) => ({
        ...item,
        priceAtOrder: toNumber(item.priceAtOrder),
        menuItem: {
          ...item.menuItem,
          price: toNumber(item.menuItem.price),
        },
      })),
    };
  });

  const totalOrders = await prisma.order.count({
    where: {
      check: {
        closedAt: { gte: startDate, lte: endDate },
      },
    },
  });

  // === CATEGORIES ===
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return {
    sales: { totalCash, totalYape, totalOverall },
    itemsSold: allItemsSold,
    orders: serializedOrders,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalOrders / ordersPerPage),
      totalOrders,
    },
    categories,
    dateRange,
    rangeType,
  };
}
