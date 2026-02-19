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

  const dailySummary = await prisma.dailySummary.findUnique({
    where: { date: today },
  });

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

  // Fetch order items
  const orderItemsMap = new Map<string, { name: string; quantity: number }>();
  if (orderItemIds.length > 0) {
    const items = await prisma.orderItem.findMany({
      where: { id: { in: orderItemIds } },
      select: {
        id: true,
        quantity: true,
        menuItem: { select: { name: true } },
      },
    });
    items.forEach((item) => {
      orderItemsMap.set(item.id, {
        name: item.menuItem.name,
        quantity: item.quantity,
      });
    });
  }

  // Fetch orders
  const ordersMap = new Map<string, { name: string; quantity: number }[]>();
  if (orderIds.length > 0) {
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: {
          select: { quantity: true, menuItem: { select: { name: true } } },
        },
      },
    });
    orders.forEach((order) => {
      const items = order.items.map((i) => ({
        name: i.menuItem.name,
        quantity: i.quantity,
      }));
      ordersMap.set(order.id, items);
    });
  }

  // Fetch checks
  const checksMap = new Map<string, { name: string; quantity: number }[]>();
  if (checkIds.length > 0) {
    const checks = await prisma.check.findMany({
      where: { id: { in: checkIds } },
      include: {
        orders: {
          include: {
            items: {
              select: { quantity: true, menuItem: { select: { name: true } } },
            },
          },
        },
      },
    });
    checks.forEach((check) => {
      const allItems: { name: string; quantity: number }[] = [];
      check.orders.forEach((order) => {
        order.items.forEach((item) => {
          allItems.push({ name: item.menuItem.name, quantity: item.quantity });
        });
      });
      checksMap.set(check.id, allItems);
    });
  }

  const processedVoidRecords = voidRecords.map((record) => {
    let targetDetails = "";
    let totalVoided = 0;

    if (record.target === "ORDER_ITEM") {
      const item = orderItemsMap.get(record.targetId);
      if (item) {
        targetDetails = `${item.name} (x${item.quantity})`;
        totalVoided = item.quantity;
      } else {
        targetDetails = "Desconocido";
      }
    } else if (record.target === "ORDER") {
      const items = ordersMap.get(record.targetId) || [];
      if (items.length > 0) {
        targetDetails = items
          .map((i) => `${i.name} (x${i.quantity})`)
          .join(", ");
        totalVoided = items.reduce((sum, i) => sum + i.quantity, 0);
      } else {
        targetDetails = "(sin items)";
      }
    } else if (record.target === "CHECK") {
      const items = checksMap.get(record.targetId) || [];
      if (items.length > 0) {
        targetDetails = items
          .map((i) => `${i.name} (x${i.quantity})`)
          .join(", ");
        totalVoided = items.reduce((sum, i) => sum + i.quantity, 0);
      } else {
        targetDetails = "(sin items)";
      }
    }

    return {
      id: record.id,
      voidedBy: record.voidedBy,
      target: record.target,
      targetDetails,
      totalVoided,
      reason: record.reason,
      createdAt: record.createdAt,
    };
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
    voidRecords: processedVoidRecords,
    date: today,
    currentPage: page,
    itemsPerPage,
  };
}
