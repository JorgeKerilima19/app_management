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

  const dailySummary = await prisma.dailySummary.findUnique({
    where: { date: today },
  });

  // 🔍 DEBUG: Fetch all relevant payments with full info
  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: today },
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

  console.log(
    "🔍 Payments found today (closed checks):",
    payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: p.amount?.toString(),
      cashAmount: p.cashAmount?.toString(),
      yapeAmount: p.yapeAmount?.toString(),
      checkTotal: p.check.total?.toString(),
      checkClosedAt: p.check.closedAt,
    })),
  );

  let totalCash = 0;
  let totalYape = 0;

  for (const p of payments) {
    const cash = toNumber(p.cashAmount || 0);
    const yape = toNumber(p.yapeAmount || 0);
    totalCash += cash;
    totalYape += yape;

    console.log(
      `→ Adding: cash=${cash}, yape=${yape} → subtotal: ${totalCash + totalYape}`,
    );
  }

  const totalOverall = totalCash + totalYape;

  // Recent Orders (only from CLOSED checks)
  const recentOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: today },
      check: { status: "CLOSED" },
    },
    include: {
      items: {
        include: { menuItem: true },
        take: 1,
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
      return {
        ...order,
        tableName,
        firstItemName: order.items[0]?.menuItem.name || "Ítem desconocido",
      };
    } catch (e) {
      return {
        ...order,
        tableName: "Mesa",
        firstItemName: "Ítem desconocido",
      };
    }
  });

  const recentVoids = await prisma.voidRecord.findMany({
    where: { createdAt: { gte: today } },
    include: { voidedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const topItems = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      order: {
        createdAt: { gte: today },
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
    recentOrders: recentOrdersWithTableNames,
    recentVoids,
    topItems: topItemsWithDetails,
    date: today,
  };
}
