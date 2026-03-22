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
  const items = await prisma.orderItem.findMany({
    where: {
      order: { checkId },
      status: { not: "VOIDED" },
    },
    select: { status: true },
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
    include: {
      order: {
        include: {
          check: {
            include: {
              tables: true,
            },
          },
        },
      },
      menuItem: {
        include: { category: true },
      },
    },
  });

  if (!item) throw new Error("Item no encontrado");
  if (item.quantity < voidQuantity) {
    throw new Error("Cantidad a anular excede la cantidad del item");
  }

  const table = item.order.check.tables[0];
  const metadata = {
    menuItem: {
      id: item.menuItemId,
      name: item.menuItem.name,
      price: item.priceAtOrder.toString(),
      category: item.menuItem.category?.name || null,
      station: item.menuItem.station,
    },
    order: {
      id: item.orderId,
      checkId: item.order.checkId,
    },
    table: table
      ? {
          id: table.id,
          number: table.number,
          name: table.name,
        }
      : null,
    quantities: {
      voided: voidQuantity,
      original: item.quantity,
      remaining: item.quantity - voidQuantity,
    },
    checkTotalAtVoid: item.order.check.total.toString(),
    voidedAt: new Date().toISOString(),
  };

  await prisma.voidRecord.create({
    data: {
      target: "ORDER_ITEM",
      targetId: orderItemId,
      reason,
      voidedById: user.id,
      note: `Anulado ${voidQuantity} de ${item.quantity}`,
      metadata, // ← Store the full context here
    },
  });

  // Proceed with deletion/update as before
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

  // ✅ Fetch check with tableIds and total BEFORE voiding
  const check = await prisma.check.findUnique({
    where: { id: checkId },
    select: { tableIds: true, status: true, total: true, openedById: true },
  });

  if (!check || check.status === "CLOSED" || check.status === "VOIDED") {
    throw new Error("La cuenta no se puede anular");
  }

  // ✅ Fetch table numbers and metadata (while relation still exists)
  let tableNumbers = "N/A";
  let tableMetadata: Array<{ number: number; name: string | null }> = [];
  try {
    const tableIdArray = JSON.parse(check.tableIds) as string[];
    if (tableIdArray.length > 0) {
      const tables = await prisma.table.findMany({
        where: { id: { in: tableIdArray } },
        select: { id: true, number: true, name: true },
      });
      tableNumbers = tables
        .map((t) => `${t.number}${t.name ? ` (${t.name})` : ""}`)
        .join(", ");
      tableMetadata = tables.map((t) => ({
        number: t.number,
        name: t.name,
      }));
    }
  } catch (error) {
    console.error("Error fetching tables for void:", error);
    tableNumbers = "N/A";
  }

  // ✅ Fetch waiter info (while relation still exists)
  let waiterName = "Desconocido";
  try {
    if (check.openedById) {
      const waiter = await prisma.user.findUnique({
        where: { id: check.openedById },
        select: { name: true },
      });
      if (waiter?.name) waiterName = waiter.name;
    }
  } catch {}

  // ✅ Fetch order items for DETAILED item summary (like voidOrderItem does)
  let itemSummary = "";
  let itemCount = 0;
  let itemMetadata: Array<{ name: string; quantity: number; price: string }> =
    [];
  let totalFormatted = "S/0.00";

  try {
    const orders = await prisma.order.findMany({
      where: { checkId },
      include: {
        items: {
          include: {
            menuItem: { select: { name: true } },
          },
        },
      },
    });

    // Build flat list of all items with quantities
    const allItems: Array<{ name: string; quantity: number; price: string }> =
      [];
    orders.forEach((order) => {
      order.items.forEach((item) => {
        allItems.push({
          name: item.menuItem?.name || "Ítem desconocido",
          quantity: item.quantity,
          price: item.priceAtOrder?.toString() || "0",
        });
        itemCount += item.quantity;
      });
    });

    if (allItems.length > 0) {
      // ✅ Build concise summary: first 3-4 items with quantities (like voidOrderItem)
      // Format: "Chaufa de pollo ×2, Coca-Cola ×3... y 2 más"
      const displayItems = allItems
        .slice(0, 4)
        .map((i) => `${i.name} ×${i.quantity}`);
      const remaining = allItems.length - 4;
      itemSummary = `${displayItems.join(", ")}${remaining > 0 ? `... y ${remaining} más` : ""}`;

      // Store first 10 items for metadata
      itemMetadata = allItems.slice(0, 10);
    }

    totalFormatted = check.total
      ? `S/${Number(check.total).toFixed(2)}`
      : "S/0.00";
  } catch (error) {
    console.error("Error fetching items for void:", error);
    itemSummary = "Ítems no disponibles";
  }

  const richNote = `Cuenta — Mesas ${tableNumbers} • ${itemSummary || "Sin items"} • ${totalFormatted}`;

  await prisma.voidRecord.create({
    data: {
      target: "CHECK",
      targetId: checkId,
      reason,
      voidedById: user.id,
      note: richNote,
      metadata: {
        check: {
          id: checkId,
          total: check.total?.toString() || "0",
          itemCount,
          openedById: check.openedById,
        },
        waiter: {
          name: waiterName,
        },
        tables: tableMetadata,
        items: itemMetadata,
        voidedAt: new Date().toISOString(),
      },
    },
  });

  await prisma.check.update({
    where: { id: checkId },
    data: { status: "VOIDED", closedAt: new Date() },
  });

  try {
    const tableIds = JSON.parse(check.tableIds) as string[];
    await prisma.table.updateMany({
      where: { id: { in: tableIds } },
      data: { status: "AVAILABLE", currentCheckId: null },
    });
  } catch (error) {
    console.error("Error freeing tables after void:", error);
  }

  // ✅ Revalidate all relevant paths
  revalidatePath("/cashier");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/close");
  revalidatePath("/settings/reports");
  revalidatePath("/settings/void-records");
}

export async function closeCheckAction(formData: FormData) {
  const checkId = formData.get("checkId") as string;
  const paymentMethod = formData.get("paymentMethod") as string;
  const cashAmountStr = formData.get("cashAmount") as string;
  const yapeAmountStr = formData.get("yapeAmount") as string;

  // Validate method
  if (!["CASH", "MOBILE_PAY", "MIXED"].includes(paymentMethod)) {
    throw new Error("Método de pago inválido");
  }

  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  // Fetch check to validate total
  const check = await prisma.check.findUnique({
    where: { id: checkId },
    select: { total: true },
  });
  if (!check) throw new Error("Check no encontrado");

  let cashAmount = 0;
  let yapeAmount = 0;
  let totalAmount = 0;

  // Enforce strict method-based assignment
  if (paymentMethod === "CASH") {
    cashAmount = parseFloat(cashAmountStr) || 0;
    yapeAmount = 0;
    totalAmount = cashAmount;
  } else if (paymentMethod === "MOBILE_PAY") {
    cashAmount = 0;
    yapeAmount = parseFloat(yapeAmountStr) || 0;
    totalAmount = yapeAmount;
  } else if (paymentMethod === "MIXED") {
    cashAmount = parseFloat(cashAmountStr) || 0;
    yapeAmount = parseFloat(yapeAmountStr) || 0;
    totalAmount = cashAmount + yapeAmount;
  }

  const checkTotalNum = Number(check.total);
  if (Math.abs(totalAmount - checkTotalNum) > 0.01) {
    throw new Error("El monto pagado no coincide con el total de la cuenta");
  }

  await prisma.payment.create({
    data: {
      checkId,
      method: paymentMethod as "CASH" | "MOBILE_PAY" | "MIXED",
      amount: totalAmount,
      cashAmount: cashAmount > 0 ? cashAmount : null,
      yapeAmount: yapeAmount > 0 ? yapeAmount : null,
      status: "COMPLETED",
      userId: user.id,
    },
  });

  // Update daily payment summary (optional but kept for compatibility)
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

  // Close the check
  await prisma.check.update({
    where: { id: checkId },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  // Free associated tables
  const checkData = await prisma.check.findUnique({
    where: { id: checkId },
    select: { tableIds: true },
  });

  if (checkData?.tableIds) {
    const tableIds = JSON.parse(checkData.tableIds) as string[];
    for (const tableId of tableIds) {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: "AVAILABLE", currentCheckId: null },
      });
    }
  }

  revalidatePath("/cashier");
}

// --- Remaining actions (unchanged, but included for completeness) ---

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
  const items = await prisma.orderItem.findMany({
    where: {
      order: { checkId },
      status: { not: "VOIDED" },
    },
    include: { order: true },
  });

  const total = items.reduce((sum, item) => {
    const price = Number(item.priceAtOrder);
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

export async function fetchAllTables() {
  const tables = await prisma.table.findMany({
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
