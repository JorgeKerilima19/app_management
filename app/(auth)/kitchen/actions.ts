// app/kitchen/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type KitchenOrder = {
  id: string;
  tableNumber: number;
  tableName: string;
  orderedAt: Date;
  waiterName: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    notes: string | null;
    categoryName: string;
    itemOrderedAt: Date;
  }[];
  orderUpdatedAt: Date;
};

export type PreparedOrder = {
  id: string;
  tableName: string;
  items: string;
  waiterName: string;
  orderedAt: Date;
  deliveredAt: Date;
};

export async function fetchActiveKitchenOrders(): Promise<KitchenOrder[]> {
  const orders = await prisma.order.findMany({
    where: {
      items: {
        some: {
          menuItem: { station: "KITCHEN" },
          status: { in: ["PENDING", "PREPARING"] },
        },
      },
    },
    include: {
      items: {
        where: {
          menuItem: { station: "KITCHEN" },
          status: { in: ["PENDING", "PREPARING"] },
        },
        select: {
          id: true,
          quantity: true,
          notes: true,
          createdAt: true, // ✅ Get item creation time
          menuItem: {
            select: {
              name: true,
              category: { select: { name: true } },
            },
          },
        },
      },
      check: {
        select: {
          tableIds: true,
        },
      },
      orderedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const tableIds = new Set<string>();
  orders.forEach((order) => {
    const ids = JSON.parse(order.check.tableIds as string) as string[];
    ids.forEach((id) => tableIds.add(id));
  });

  const tables = await prisma.table.findMany({
    where: { id: { in: Array.from(tableIds) } },
    select: { id: true, number: true, name: true },
  });
  const tableMap = new Map(
    tables.map((t) => [
      t.id,
      { number: t.number, name: t.name || `Mesa ${t.number}` },
    ])
  );

  return orders.map((order) => {
    const tableIds = JSON.parse(order.check.tableIds as string);
    const table = tableMap.get(tableIds[0]) || { number: 0, name: "Mesa" };

    return {
      id: order.id,
      tableNumber: table.number,
      tableName: table.name,
      orderedAt: order.createdAt,
      waiterName: order.orderedBy.name,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        notes: item.notes,
        categoryName: item.menuItem.category.name,
        itemOrderedAt: item.createdAt,
      })),
      orderUpdatedAt: order.updatedAt,
    };
  });
}

export async function fetchPreparedToday(): Promise<PreparedOrder[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      items: {
        some: {
          menuItem: { station: "KITCHEN" },
          status: "READY",
        },
      },
      updatedAt: { gte: startOfDay },
    },
    include: {
      items: {
        where: {
          menuItem: { station: "KITCHEN" },
          status: "READY",
        },
        select: {
          menuItem: { select: { name: true } },
          quantity: true,
          notes: true,
        },
      },
      check: {
        select: {
          tableIds: true,
        },
      },
      orderedBy: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Get table names
  const tableIds = new Set<string>();
  orders.forEach((order) => {
    const ids = JSON.parse(order.check.tableIds as string) as string[];
    ids.forEach((id) => tableIds.add(id));
  });

  const tables = await prisma.table.findMany({
    where: { id: { in: Array.from(tableIds) } },
    select: { id: true, name: true, number: true },
  });
  const tableMap = new Map(
    tables.map((t) => [t.id, t.name || `Mesa ${t.number}`])
  );

  return orders.map((order) => {
    const tableIds = JSON.parse(order.check.tableIds as string);
    const tableName = tableMap.get(tableIds[0]) || "Mesa";

    // Format items as string: "Lomo (x1), Beer (x2)"
    const itemsStr = order.items
      .map(
        (item) =>
          `${item.menuItem.name}${
            item.quantity > 1 ? ` (x${item.quantity})` : ""
          }`
      )
      .join(", ");

    return {
      id: order.id,
      tableName,
      items: itemsStr,
      waiterName: order.orderedBy.name,
      orderedAt: order.createdAt,
      deliveredAt: order.updatedAt, // ✅ now correctly updated
    };
  });
}

export async function markOrderAsReady(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["COCINERO", "OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const orderItemId = formData.get("orderItemId")?.toString();
  if (!orderItemId) return;

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { status: "READY" },
  });

  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    select: { orderId: true },
  });
  if (orderItem) {
    await prisma.order.update({
      where: { id: orderItem.orderId },
      data: { updatedAt: new Date() },
    });
  }

  revalidatePath("/kitchen");
}
