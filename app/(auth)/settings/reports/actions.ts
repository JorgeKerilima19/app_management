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
import { fromZonedTime, toZonedTime } from "date-fns-tz"; // Assuming import works now

// Define the timezone constant
const REPORT_TIMEZONE = "America/Lima";

function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  // Handle Prisma Decimal
  if (value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return parseFloat(value.toString());
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
  let startDate: Date;
  let endDate: Date;

  // Calculate start and end dates in the REPORT_TIMEZONE
  if (rangeType === "all") {
    startDate = new Date("2020-01-01");
    endDate = new Date();
    // Convert to UTC for database query using date-fns-tz
    startDate = fromZonedTime(startDate, REPORT_TIMEZONE);
    endDate = fromZonedTime(endDate, REPORT_TIMEZONE);
  } else if (rangeType === "day") {
    // Parse the input date string as if it were midnight in the report timezone
    const startOfDay = parseISO(dateRange);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    // Convert these local date boundaries to UTC for the database query using date-fns-tz
    startDate = fromZonedTime(startOfDay, REPORT_TIMEZONE);
    endDate = fromZonedTime(endOfDay, REPORT_TIMEZONE);
  } else if (rangeType === "week") {
    // Parse the input date string and find the start of the week in the report timezone
    const inputDate = parseISO(dateRange);
    const weekStartLocal = startOfWeek(inputDate, { weekStartsOn: 1 }); // Assuming Monday start
    weekStartLocal.setHours(0, 0, 0, 0); // Start of the day
    const weekEndLocal = endOfWeek(weekStartLocal, { weekStartsOn: 1 });
    weekEndLocal.setHours(23, 59, 59, 999); // End of the day

    // Convert these local week boundaries to UTC for the database query using date-fns-tz
    startDate = fromZonedTime(weekStartLocal, REPORT_TIMEZONE);
    endDate = fromZonedTime(weekEndLocal, REPORT_TIMEZONE);
  } else if (rangeType === "month") {
    // Parse the input date string and find the start/end of the month in the report timezone
    const startOfMonthLocal = startOfMonth(parseISO(`${dateRange}-01`));
    startOfMonthLocal.setHours(0, 0, 0, 0);
    const endOfMonthLocal = endOfMonth(startOfMonthLocal);
    endOfMonthLocal.setHours(23, 59, 59, 999);

    // Convert these local month boundaries to UTC for the database query using date-fns-tz
    startDate = fromZonedTime(startOfMonthLocal, REPORT_TIMEZONE);
    endDate = fromZonedTime(endOfMonthLocal, REPORT_TIMEZONE);
  } else {
    startDate = new Date("2020-01-01");
    endDate = new Date();
    startDate = fromZonedTime(startDate, REPORT_TIMEZONE);
    endDate = fromZonedTime(endDate, REPORT_TIMEZONE);
  }

  console.log(
    `Report Date Range (UTC): ${startDate} to ${endDate}, Type: ${rangeType}`
  ); // Debug log

  // === SALES SUMMARY ===
  let totalCash = 0;
  let totalYape = 0;
  let totalOverall = 0;

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
    .reduce((sum, p) => sum + (p.yapeAmount ? toNumber(p.yapeAmount) : 0), 0);

  totalOverall = payments.reduce((sum, p) => sum + toNumber(p.amount), 0);

  // === DAILY CASH FLOW (only for single day) ===
  let dailyCashFlow = null;
  if (rangeType === "day") {
    const summaryDate = new Date(dateRange);
    summaryDate.setHours(0, 0, 0, 0); // Ensure it's start of day in local time

    const dailySummary = await prisma.dailySummary.findUnique({
      where: { date: summaryDate },
    });

    if (dailySummary) {
      // Calculate cash sales specifically for this day
      // This is the same logic as used for totalCash but isolated for clarity
      const dayPayments = await prisma.payment.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          method: { in: ["CASH", "MIXED"] }, // Only cash-related payments
        },
      });

      let cashSalesForDay = 0;
      dayPayments.forEach((p) => {
        cashSalesForDay += p.cashAmount
          ? toNumber(p.cashAmount)
          : toNumber(p.amount);
      });

      dailyCashFlow = {
        openingCash: toNumber(dailySummary.startingCash),
        cashSalesForDay, // Use the calculated value
        endingCash: toNumber(dailySummary.endingCash), // This is the calculated ending cash from the summary
      };
    }
  }

  // === ALL ITEMS SOLD (GROUPED BY MENU ITEM) ===
  const itemGroups = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      order: {
        check: {
          closedAt: { gte: startDate, lte: endDate },
          status: "CLOSED",
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

  // === ALL CHECKS (SUMMARIZED FOR TABLE) ===
  const skip = (page - 1) * checksPerPage;

  const checks = await prisma.check.findMany({
    where: {
      closedAt: { gte: startDate, lte: endDate },
      status: "CLOSED",
    }, // Ensure closedAt is not null based on status filter
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

  // Extract unique table IDs from all checks' tableIds JSON strings
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

  // Fetch the corresponding table names/numbers
  let tableMap = new Map<string, { number: number; name: string | null }>();
  if (allCheckTableIds.size > 0) {
    const tables = await prisma.table.findMany({
      where: { id: { in: Array.from(allCheckTableIds) } },
      select: { id: true, number: true, name: true },
    });
    tableMap = new Map(
      tables.map((t) => [t.id, { number: t.number, name: t.name }])
    );
  }

  // Map PaymentMethod enum to Spanish
  const paymentMethodMap: Record<string, string> = {
    CASH: "Efectivo",
    MOBILE_PAY: "Yape",
    MIXED: "Mixto",
  };

  // Serialize checks for the table view
  const serializedChecks = checks.map((check) => {
    // Extract table names/numbers from JSON string using the fetched map
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

    // Calculate total items quantity and list names for the check
    let totalItemsQuantity = 0;
    const itemNames: string[] = [];
    check.orders.forEach((order) => {
      order.items.forEach((item) => {
        totalItemsQuantity += item.quantity;
        itemNames.push(item.menuItem.name);
      });
    });

    // Format the closedAt date in the REPORT_TIMEZONE for display using date-fns-tz
    // --- FIX: Add null check ---
    let formattedDate = "Fecha desconocida"; // Default if closedAt is null
    if (check.closedAt !== null) {
      const closedAtZoned = toZonedTime(check.closedAt, REPORT_TIMEZONE);
      formattedDate = format(closedAtZoned, "yyyy-MM-dd HH:mm"); // Adjust format as needed
    }
    // --- END FIX ---

    // Determine payment method string (in Spanish)
    const paymentMethodsUsed = Array.from(
      new Set(check.payments.map((p) => paymentMethodMap[p.method] || p.method))
    );

    return {
      id: check.id,
      tableNames: tableInfo
        .map((info) => info.name || `Mesa ${info.number}`)
        .join(", "),
      closedAt: formattedDate, // Use the zoned and formatted date string, or default
      itemNames, // List of item names
      totalItemsQuantity, // Total quantity across all items in the check
      paymentMethods: paymentMethodsUsed.join(", "), // Join methods if multiple
      total: toNumber(check.total), // Ensure total is a number
    };
  });

  const totalChecks = await prisma.check.count({
    where: {
      closedAt: { gte: startDate, lte: endDate },
      status: "CLOSED", // Ensure closedAt is not null based on status filter
    },
  });

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const salesData = {
    totalCash: toNumber(totalCash),
    totalYape: toNumber(totalYape),
    totalOverall: toNumber(totalOverall),
  };

  return {
    sales: salesData,
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
    // Add daily cash flow data
    dailyCashFlow,
  };
}
