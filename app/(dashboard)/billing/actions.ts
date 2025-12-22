// app/(dashboard)/tables/[id]/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function mergeTablesAction(formData: FormData) {
  const tableId1 = formData.get("tableId1") as string;
  const tableId2 = formData.get("tableId2") as string;

  if (tableId1 === tableId2)
    throw new Error("Cannot merge a table with itself");

  const [table1, table2] = await prisma.$transaction([
    prisma.table.findUnique({
      where: { id: tableId1 },
      include: { currentCheck: true },
    }),
    prisma.table.findUnique({
      where: { id: tableId2 },
      include: { currentCheck: true },
    }),
  ]);

  if (!table1 || !table2) throw new Error("One or both tables not found");
  if (table1.status !== "OCCUPIED" || table2.status !== "OCCUPIED") {
    throw new Error("Only occupied tables can be merged");
  }
  if (!table1.currentCheck || !table2.currentCheck) {
    throw new Error("Both tables must have active checks");
  }

  await prisma.order.updateMany({
    where: { checkId: table2.currentCheck.id },
    data: { checkId: table1.currentCheck.id },
  });

  // ✅ RAW TOTAL (no tax)
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        checkId: table1.currentCheck.id,
        status: { in: ["PENDING", "SENT", "READY", "COMPLETED"] },
      },
    },
  });

  const total = items.reduce((sum, item) => {
    const price = Number(item.priceAtOrder);
    return sum + price * item.quantity;
  }, 0);

  await prisma.check.update({
    where: { id: table1.currentCheck.id },
    data: {
      subtotal: total,
      tax: 0,
      discount: 0,
      total: total,
    },
  });

  await prisma.check.update({
    where: { id: table2.currentCheck.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  await prisma.table.update({
    where: { id: tableId2 },
    data: { status: "AVAILABLE", currentCheckId: null },
  });

  revalidatePath("/cashier");
}
export async function closeCheckAction(formData: FormData) {
  const checkId = formData.get("checkId") as string;
  const paymentMethod = formData.get("paymentMethod") as string;
  const cashAmountStr = formData.get("cashAmount") as string;
  const yapeAmountStr = formData.get("yapeAmount") as string;

  const cashAmount = Number(cashAmountStr);
  const yapeAmount = Number(yapeAmountStr);
  const totalAmount = cashAmount + yapeAmount;

  // ✅ Save split amounts
  await prisma.payment.create({
    data: {
      checkId,
      method: paymentMethod as "CASH" | "MOBILE_PAY" | "MIXED",
      amount: totalAmount,
      cashAmount: cashAmount || null, // ← Save if exists
      mobilePayAmount: yapeAmount || null, // ← Save if exists
      status: "COMPLETED",
    },
  });

  // Update PaymentSummary
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.paymentSummary.upsert({
    where: { date: today },
    update: {
      cashTotal: { increment: cashAmount },
      yapeTotal: { increment: yapeAmount },
      total: { increment: totalAmount },
    },
    create: {
      date: today,
      cashTotal: cashAmount,
      yapeTotal: yapeAmount,
      total: totalAmount,
    },
  });

  // Close check and free tables
  await prisma.check.update({
    where: { id: checkId },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  const check = await prisma.check.findUnique({
    where: { id: checkId },
    select: { tableIds: true },
  });

  const tableIds = JSON.parse(check!.tableIds);
  for (const tableId of tableIds) {
    await prisma.table.update({
      where: { id: tableId },
      data: { status: "AVAILABLE", currentCheckId: null },
    });
  }

  revalidatePath("/cashier");
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

// ✅ FIXED: No tax, raw total
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
    const price =
      typeof item.priceAtOrder === "object"
        ? parseFloat(item.priceAtOrder.toString())
        : item.priceAtOrder;
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
