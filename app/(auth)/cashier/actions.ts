// app/(auth)/cashier/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return parseFloat(value.toString());
}

export async function fetchTables() {
  const tables = await prisma.table.findMany({
    where: { status: { in: ["OCCUPIED", "RESERVED"] } },
    include: {
      currentCheck: {
        include: {
          orders: {
            include: {
              items: {
                include: {
                  menuItem: {
                    include: { category: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { number: "asc" },
  });

  return tables.map((table) => {
    if (!table.currentCheck) {
      return { ...table, currentCheck: null };
    }

    return {
      ...table,
      currentCheck: {
        ...table.currentCheck,
        subtotal: toNumber(table.currentCheck.subtotal),
        tax: toNumber(table.currentCheck.tax),
        discount: toNumber(table.currentCheck.discount),
        total: toNumber(table.currentCheck.total),
        orders: table.currentCheck.orders.map((order) => ({
          ...order,
          items: order.items.map((item) => ({
            ...item,
            priceAtOrder: toNumber(item.priceAtOrder),
            menuItem: {
              ...item.menuItem,
              price: toNumber(item.menuItem.price),
            },
          })),
        })),
      },
    };
  });
}

export async function canPayCheck(checkId: string): Promise<boolean> {
  // Fetch all non-voided items for the check
  const items = await prisma.orderItem.findMany({
    where: {
      order: { checkId },
      status: { not: "VOIDED" }, // Exclude voided items
    },
    select: { status: true }, // Only select the status
  });

  if (items.length === 0) {
    return false;
  }

  const allServed = items.every((item) => item.status === "READY");
  return allServed;
}

export async function voidOrderItem(formData: FormData) {
  const orderItemId = formData.get("orderItemId") as string;
  const voidQuantityStr = formData.get("voidQuantity") as string;
  const reason = (formData.get("reason") as string)?.trim();

  if (!reason || reason.length < 3) {
    throw new Error("Razón requerida (mínimo 3 caracteres)");
  }

  const voidQuantity = parseInt(voidQuantityStr);
  if (isNaN(voidQuantity) || voidQuantity <= 0) {
    throw new Error("Cantidad inválida");
  }

  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: { include: { check: true } } },
  });

  if (!item) throw new Error("Item no encontrado");
  if (item.quantity < voidQuantity) {
    throw new Error("Cantidad a anular excede la cantidad del item");
  }

  await prisma.voidRecord.create({
    data: {
      target: "ORDER_ITEM",
      targetId: orderItemId,
      reason,
      voidedById: user.id,
      note: `Anulado ${voidQuantity} de ${item.quantity}`,
    },
  });

  if (voidQuantity === item.quantity) {
    await prisma.orderItem.delete({ where: { id: orderItemId } });
  } else {
    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { quantity: item.quantity - voidQuantity },
    });
  }

  await updateCheckTotal(item.order.checkId);
  revalidatePath("/cashier");
}

export async function voidOrder(formData: FormData) {
  const checkId = formData.get("checkId") as string;
  const reason = (formData.get("reason") as string)?.trim();

  if (!reason || reason.length < 3) {
    throw new Error("Razón requerida (mínimo 3 caracteres)");
  }

  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const check = await prisma.check.findUnique({
    where: { id: checkId },
    select: { tableIds: true, status: true },
  });

  if (!check || check.status === "CLOSED" || check.status === "VOIDED") {
    throw new Error("La cuenta no se puede anular");
  }

  await prisma.voidRecord.create({
    data: {
      target: "CHECK",
      targetId: checkId,
      reason,
      voidedById: user.id,
    },
  });

  await prisma.check.update({
    where: { id: checkId },
    data: { status: "VOIDED", closedAt: new Date() },
  });

  const tableIds = JSON.parse(check.tableIds);
  await prisma.table.updateMany({
    where: { id: { in: tableIds } },
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

  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  await prisma.payment.create({
    data: {
      checkId,
      method: paymentMethod as "CASH" | "MOBILE_PAY" | "MIXED",
      amount: totalAmount,
      cashAmount: cashAmount || null,
      yapeAmount: yapeAmount || null,
      status: "COMPLETED",
      userId: user.id,
    },
  });

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

// --- ALL PREVIOUS ACTIONS FROM YOUR DEVELOPMENT ---

export async function mergeTablesAction(formData: FormData) {
  const tableId1 = formData.get("tableId1") as string;
  const tableId2 = formData.get("tableId2") as string;

  if (tableId1 === tableId2)
    throw new Error("No se puede fusionar una mesa consigo misma");

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

  if (!table1 || !table2) throw new Error("Una o ambas mesas no encontradas");
  if (table1.status !== "OCCUPIED" || table2.status !== "OCCUPIED") {
    throw new Error("Solo mesas ocupadas pueden fusionarse");
  }
  if (!table1.currentCheck || !table2.currentCheck) {
    throw new Error("Ambas mesas deben tener cheques activos");
  }

  await prisma.order.updateMany({
    where: { checkId: table2.currentCheck.id },
    data: { checkId: table1.currentCheck.id },
  });

  // Recalculate total
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

async function updateCheckTotal(checkId: string) {
  // Find items from orders belonging to the check
  // Exclude items that are VOIDED (they don't count towards the total)
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        checkId, // The order belongs to the specified check
      },
      status: { not: "VOIDED" }, // The item itself is not voided
    },
    include: {
      order: true,
    },
  });

  const total = items.reduce((sum, item) => {
    const price = Number(item.priceAtOrder);
    return sum + price * item.quantity;
  }, 0);

  await prisma.check.update({
    where: { id: checkId },
    data: {
      subtotal: total,
      tax: 0, // Or calculate tax based on your business logic
      discount: 0, // Or apply discounts
      total: total,
    },
  });
}
export async function fetchAllTables() {
  const tables = await prisma.table.findMany({
    // Remove the where clause that filtered for occupied/reserved
    // where: { status: { in: ["OCCUPIED", "RESERVED"] } },
    include: {
      currentCheck: {
        include: {
          orders: {
            include: {
              items: {
                include: {
                  menuItem: {
                    include: { category: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { number: "asc" },
  });

  // Apply the same number conversion logic as before
  function toNumber(value: any): number {
    if (value == null) return 0;
    if (typeof value === "number") return value;
    return parseFloat(value.toString());
  }

  return tables.map((table) => {
    if (!table.currentCheck) {
      // Return table object without check data if no active check
      return { ...table, currentCheck: null };
    }

    // Return table object with processed check data if an active check exists
    return {
      ...table,
      currentCheck: {
        ...table.currentCheck,
        subtotal: toNumber(table.currentCheck.subtotal),
        tax: toNumber(table.currentCheck.tax),
        discount: toNumber(table.currentCheck.discount),
        total: toNumber(table.currentCheck.total),
        orders: table.currentCheck.orders.map((order) => ({
          ...order,
          items: order.items.map((item) => ({
            ...item,
            priceAtOrder: toNumber(item.priceAtOrder),
            menuItem: {
              ...item.menuItem,
              price: toNumber(item.menuItem.price),
            },
          })),
        })),
      },
    };
  });
}
