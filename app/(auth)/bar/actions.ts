// app/bar/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export type BarOrder = {
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
  }[];
  orderUpdatedAt: Date;
};

export type PreparedBarOrder = {
  id: string;
  tableName: string;
  items: string;
  waiterName: string;
  orderedAt: Date;
  deliveredAt: Date;
};

export async function fetchActiveBarOrders(): Promise<BarOrder[]> {
  const orders = await prisma.order.findMany({
    where: {
      items: {
        some: {
          menuItem: { station: "BAR" },
          status: { in: ["PENDING", "PREPARING"] },
        },
      },
    },
    include: {
      items: {
        where: {
          menuItem: { station: "BAR" },
          status: { in: ["PENDING", "PREPARING"] },
        },
        select: {
          id: true,
          quantity: true,
          notes: true,
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
      })),
      orderUpdatedAt: order.updatedAt,
    };
  });
}

export async function fetchPreparedBarToday(): Promise<PreparedBarOrder[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      items: {
        some: {
          menuItem: { station: "BAR" },
          status: "READY",
        },
      },
      updatedAt: { gte: startOfDay },
    },
    include: {
      items: {
        where: {
          menuItem: { station: "BAR" },
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
      deliveredAt: order.updatedAt,
    };
  });
}

// ✅ Update Order.updatedAt when marking as ready
export async function markBarOrderAsReady(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;

  await prisma.orderItem.updateMany({
    where: {
      orderId,
      menuItem: { station: "BAR" },
    },
    data: { status: "READY" },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/bar");
}
