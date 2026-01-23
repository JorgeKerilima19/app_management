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

  // ✅ CORRECT: Only count actual sales (exclude opening amount)
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

  // ✅ Closing cash = Opening + Total Cash Sales
  const endingCash = toNumber(summary.startingCash) + totalCash;

  await prisma.dailySummary.update({
    where: { id: summary.id },
    data: {
      totalCash: totalCash, // ✅ Only sales
      totalYape: totalYape, // ✅ Only sales
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

  const dailySummary = await prisma.dailySummary.findUnique({
    where: { date: today },
  });

  // ✅ CORRECT: Only count actual sales
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

  // ✅ Paginated items sold
  const skip = (page - 1) * itemsPerPage;

  const itemGroups = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      createdAt: { gte: today },
      order: {
        check: {
          status: "CLOSED",
          closedAt: { gte: today },
        },
      },
      menuItem: categoryId ? { categoryId } : undefined,
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
  });

  // Apply pagination
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

  const itemsSold = paginatedItemGroups.map((g) => ({
    menuItem: menuItemsMap.get(g.menuItemId),
    totalQuantity: g._sum.quantity || 0,
  }));

  const inventoryChanges = await prisma.inventoryItem.findMany({
    where: {
      updatedAt: { gte: today },
    },
    orderBy: { updatedAt: "desc" },
  });

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const voidRecords = await prisma.voidRecord.findMany({
    where: { createdAt: { gte: today } },
    include: { voidedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return {
    dailySummary: dailySummary
      ? {
          id: dailySummary.id,
          startingCash: toNumber(dailySummary.startingCash),
          endingCash: toNumber(dailySummary.endingCash),
          status: dailySummary.status,
        }
      : null,
    sales: {
      totalCash,
      totalYape,
    },
    itemsSold,
    totalItems,
    inventoryChanges,
    categories,
    voidRecords,
    date: today,
    currentPage: page,
    itemsPerPage,
  };
}
