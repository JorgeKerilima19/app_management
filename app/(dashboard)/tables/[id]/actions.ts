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
  try {
    const tableId = formData.get("tableId") as string;
    const menuItemId = formData.get("menuItemId") as string;
    const quantity = parseInt(formData.get("quantity") as string) || 1;

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

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        menuItemId,
        quantity,
        notes: null,
        priceAtOrder: menuItem.price,
        modifiers: [],
      },
    });

    await updateCheckTotal(table.currentCheck.id);
    revalidatePath(`/tables/${tableId}`);
  } catch (error) {
    console.error("addItemToOrder error:", error);
    throw error;
  }
}

export async function removeItemFromOrder(formData: FormData) {
  const tableId = formData.get("tableId") as string;
  const orderItemId = formData.get("orderItemId") as string;

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: true },
  });

  if (!item || item.order.status !== "PENDING") {
    throw new Error("Can only delete items from pending orders");
  }

  await prisma.orderItem.delete({ where: { id: orderItemId } });
  await updateCheckTotal(item.order.checkId);
  revalidatePath(`/tables/${tableId}`);
}

export async function sendOrdersToKitchen(formData: FormData) {
  const tableId = formData.get("tableId") as string;

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { currentCheck: true },
  });

  if (!table?.currentCheck) throw new Error("No active check");

  await prisma.order.updateMany({
    where: { checkId: table.currentCheck.id, status: "PENDING" },
    data: { status: "SENT", sentToKitchenAt: new Date() },
  });

  revalidatePath(`/tables/${tableId}`);
}

// ✅ FIXED: NO TAX — RAW TOTAL ONLY
async function updateCheckTotal(checkId: string) {
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        checkId,
        status: { in: ["PENDING", "SENT", "READY", "COMPLETED"] },
      },
    },
  });

  // ✅ RAW TOTAL = sum of (priceAtOrder * quantity)
  const total = items.reduce((sum, item) => {
    const price = toNumber(item.priceAtOrder);
    return sum + price * item.quantity;
  }, 0);

  // ✅ Set tax=0, discount=0, total=raw sum
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
