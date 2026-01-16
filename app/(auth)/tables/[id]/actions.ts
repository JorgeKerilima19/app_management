// app/(auth)/tables/[id]/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return parseFloat(value.toString());
}

export async function openTableAction(formData: FormData) {
  const tableId = formData.get("tableId") as string;
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const table = await prisma.table.findFirst({
    where: { id: tableId, deletedAt: null, status: "AVAILABLE" },
  });

  if (!table) {
    revalidatePath(`/tables/${tableId}`);
    return;
  }

  const check = await prisma.check.create({
    data: {
      status: "OPEN",
      tableIds: JSON.stringify([tableId]),
      openedById: user.id,
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
    },
  });

  await prisma.order.create({
    data: {
      status: "PENDING",
      checkId: check.id,
      orderedById: user.id,
    },
  });

  await prisma.table.update({
    where: { id: tableId },
    data: { status: "OCCUPIED", currentCheckId: check.id },
  });

  redirect(`/tables/${tableId}`);
}

export async function addItemToOrder(formData: FormData) {
  const tableId = formData.get("tableId") as string;
  const menuItemId = formData.get("menuItemId") as string;

  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const table = await prisma.table.findFirst({
    where: { id: tableId, deletedAt: null },
    include: { currentCheck: true },
  });

  if (!table?.currentCheck) throw new Error("No active check");

  let order = await prisma.order.findFirst({
    where: { checkId: table.currentCheck.id, status: "PENDING" },
  });

  if (!order) {
    order = await prisma.order.create({
      data: {
        status: "PENDING",
        checkId: table.currentCheck.id,
        orderedById: user.id,
      },
    });
  }

  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
  });
  if (!menuItem) throw new Error("Invalid menu item");

  const existingItem = await prisma.orderItem.findFirst({
    where: { orderId: order.id, menuItemId },
  });

  if (existingItem) {
    await prisma.orderItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + 1 },
    });
  } else {
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        menuItemId,
        quantity: 1,
        notes: null,
        priceAtOrder: menuItem.price,
        modifiers: [],
      },
    });
  }

  await updateCheckTotal(table.currentCheck.id);
  revalidatePath(`/tables/${tableId}`);
}

export async function removeItemFromOrder(formData: FormData) {
  const tableId = formData.get("tableId") as string;
  const menuItemId = formData.get("menuItemId") as string;

  const table = await prisma.table.findFirst({
    where: { id: tableId, deletedAt: null },
    include: { currentCheck: true },
  });

  if (!table?.currentCheck) return;

  const pendingOrder = await prisma.order.findFirst({
    where: { checkId: table.currentCheck.id, status: "PENDING" },
  });

  if (!pendingOrder) return;

  const item = await prisma.orderItem.findFirst({
    where: { orderId: pendingOrder.id, menuItemId },
  });

  if (!item) return;

  if (item.quantity <= 1) {
    await prisma.orderItem.delete({ where: { id: item.id } });
  } else {
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { quantity: item.quantity - 1 },
    });
  }

  await updateCheckTotal(table.currentCheck.id);
  revalidatePath(`/tables/${tableId}`);
}

export async function updateItemNotes(formData: FormData) {
  const tableId = formData.get("tableId") as string;
  const menuItemId = formData.get("menuItemId") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const table = await prisma.table.findFirst({
    where: { id: tableId, deletedAt: null },
    include: { currentCheck: true },
  });

  if (!table?.currentCheck) return;

  const pendingOrder = await prisma.order.findFirst({
    where: { checkId: table.currentCheck.id, status: "PENDING" },
  });

  if (!pendingOrder) return;

  const item = await prisma.orderItem.findFirst({
    where: { orderId: pendingOrder.id, menuItemId },
  });

  if (item) {
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { notes },
    });
    await updateCheckTotal(table.currentCheck.id);
    revalidatePath(`/tables/${tableId}`);
  }
}

export async function sendOrderToStations(formData: FormData) {
  const tableId = formData.get("tableId") as string;
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const table = await prisma.table.findFirst({
    where: { id: tableId, deletedAt: null },
    include: { currentCheck: true },
  });

  if (!table?.currentCheck) return;

  const pendingOrder = await prisma.order.findFirst({
    where: { checkId: table.currentCheck.id, status: "PENDING" },
    include: { items: { include: { menuItem: true } } },
  });

  if (!pendingOrder || pendingOrder.items.length === 0) return;

  const hasKitchen = pendingOrder.items.some(
    (item) => item.menuItem.station === "KITCHEN"
  );
  const hasBar = pendingOrder.items.some(
    (item) => item.menuItem.station === "BAR"
  );

  const now = new Date();

  await prisma.order.update({
    where: { id: pendingOrder.id },
    data: {
      status: "SENT",
      sentToKitchenAt: hasKitchen ? now : null,
      sentToBarAt: hasBar ? now : null,
    },
  });

  await prisma.order.create({
    data: {
      status: "PENDING",
      checkId: table.currentCheck.id,
      orderedById: user.id,
    },
  });

  revalidatePath(`/tables/${tableId}`);
}

async function updateCheckTotal(checkId: string) {
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        checkId,
        status: { in: ["PENDING", "SENT", "READY", "COMPLETED"] },
      },
    },
  });

  const total = items.reduce((sum, item) => {
    const price = toNumber(item.priceAtOrder);
    return sum + price * item.quantity;
  }, 0);

  await prisma.check.update({
    where: { id: checkId },
    data: {
      subtotal: total,
      tax: 0,
      discount: 0,
      total: total,
    },
  });
}
