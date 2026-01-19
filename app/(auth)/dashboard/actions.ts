// app/dashboard/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

  // Daily Summary
  const dailySummary = await prisma.dailySummary.findUnique({
    where: { date: today },
  });

  // Payments
  const payments = await prisma.payment.findMany({
    where: { createdAt: { gte: today } },
  });

  let totalCash = 0;
  let totalYape = 0;
  let totalMixed = 0;
  let totalOverall = 0;

  payments.forEach((p) => {
    totalOverall += Number(p.amount);
    if (p.method === "CASH") totalCash += Number(p.amount);
    if (p.method === "MOBILE_PAY") totalYape += Number(p.amount);
    if (p.method === "MIXED") {
      totalCash += p.cashAmount ? Number(p.cashAmount) : 0;
      totalYape += p.yapeAmount ? Number(p.yapeAmount) : 0;
      totalMixed += Number(p.amount);
    }
  });

  // Recent Orders
  const recentOrders = await prisma.order.findMany({
    where: { createdAt: { gte: today } },
    include: {
      items: { include: { menuItem: true } },
      check: { include: { tables: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Void Records
  const recentVoids = await prisma.voidRecord.findMany({
    where: { createdAt: { gte: today } },
    include: { voidedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Top Items
  const topItems = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: { order: { createdAt: { gte: today } } },
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
      totalMixed,
      totalOverall,
      cashPercentage: totalOverall > 0 ? (totalCash / totalOverall) * 100 : 0,
      yapePercentage: totalOverall > 0 ? (totalYape / totalOverall) * 100 : 0,
      mixedPercentage: totalOverall > 0 ? (totalMixed / totalOverall) * 100 : 0,
    },
    recentOrders,
    recentVoids,
    topItems: topItemsWithDetails,
    date: today,
  };
}
