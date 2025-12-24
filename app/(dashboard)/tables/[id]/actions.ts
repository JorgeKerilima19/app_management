// app/(dashboard)/tables/[id]/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return parseFloat(value.toString());
}

export async function openTableAction(formData: FormData) {
  const tableId = formData.get("tableId") as string;
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

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

  // ✅ Create initial PENDING order
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

  revalidatePath(`/tables/${tableId}`);
}

export async function addItemToOrder(formData: FormData) {
  const tableId = formData.get("tableId") as string;
  const menuItemId = formData.get("menuItemId") as string;

  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const table = await prisma.table.findUnique({
    where: { id: tableId },
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

  // Find existing item in this pending order
  const existingItem = await prisma.orderItem.findFirst({
    where: {
      orderId: order.id,
      menuItemId,
    },
  });

  if (existingItem) {
    // Increment quantity by 1
    await prisma.orderItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + 1 },
    });
  } else {
    // Create new with qty=1
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

export async function updateItemNotes(formData: FormData) {
  const tableId = formData.get("tableId") as string;
  const menuItemId = formData.get("menuItemId") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { currentCheck: true },
  });

  if (!table?.currentCheck) throw new Error("No active check");

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
export async function removeItemFromOrder(formData: FormData) {
  const tableId = formData.get("tableId") as string;
  const menuItemId = formData.get("menuItemId") as string;

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { currentCheck: true },
  });

  if (!table?.currentCheck) throw new Error("No active check");

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

export async function sendOrdersToKitchen(formData: FormData) {
  const tableId = formData.get("tableId") as string;

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { currentCheck: true },
  });

  if (!table?.currentCheck) throw new Error("No active check");

  // ✅ Mark current PENDING order as SENT
  await prisma.order.updateMany({
    where: { checkId: table.currentCheck.id, status: "PENDING" },
    data: { status: "SENT", sentToKitchenAt: new Date() },
  });

  // ✅ Create a NEW PENDING order for future items
  const user: any = await getCurrentUser();
  await prisma.order.create({
    data: {
      status: "PENDING",
      checkId: table.currentCheck.id,
      orderedById: user.id,
    },
  });

  revalidatePath(`/tables/${tableId}`);
}

export async function updatePendingItem(formData: FormData) {
  const tableId = formData.get("tableId") as string;
  const menuItemId = formData.get("menuItemId") as string;
  const quantity = parseInt(formData.get("quantity") as string) || 0;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { currentCheck: true },
  });

  if (!table?.currentCheck) throw new Error("No active check");

  const pendingOrder = await prisma.order.findFirst({
    where: { checkId: table.currentCheck.id, status: "PENDING" },
  });

  if (!pendingOrder) throw new Error("No pending order");

  const item = await prisma.orderItem.findFirst({
    where: { orderId: pendingOrder.id, menuItemId },
  });

  if (!item) {
    // Should not happen, but create if missing
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });
    if (!menuItem) throw new Error("Invalid menu item");
    await prisma.orderItem.create({
      data: {
        orderId: pendingOrder.id,
        menuItemId,
        quantity,
        notes,
        priceAtOrder: menuItem.price,
        modifiers: [],
      },
    });
  } else if (quantity <= 0) {
    // Delete if quantity is 0 or less
    await prisma.orderItem.delete({ where: { id: item.id } });
  } else {
    // Update
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { quantity, notes },
    });
  }

  await updateCheckTotal(table.currentCheck.id);
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
