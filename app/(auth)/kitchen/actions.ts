//app/(auth)/kitchen/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deductInventoryForOrderItem } from "@/lib/inventory";

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
          createdAt: true,
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
    ]),
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
    tables.map((t) => [t.id, t.name || `Mesa ${t.number}`]),
  );

  return orders.map((order) => {
    const tableIds = JSON.parse(order.check.tableIds as string);
    const tableName = tableMap.get(tableIds[0]) || "Mesa";

    const itemsStr = order.items
      .map(
        (item) =>
          `${item.menuItem.name}${
            item.quantity > 1 ? ` (x${item.quantity})` : ""
          }`,
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

  try {
    const result = await deductInventoryForOrderItem(orderItemId);

    if (result && !result.skipped) {
      console.log(
        `Inventory deducted for ${result.menuItemName}:`,
        result.deductions,
      );
    }
  } catch (error) {
    console.error("Failed to deduct inventory:", error);
  }

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
  return { success: true };
}
export async function getInventoryItemsForRequirements() {
  "use server";

  return await prisma.inventoryItem.findMany({
    where: {
      currentQuantity: { gt: 0 },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      currentQuantity: true,
      unit: true,
      category: true,
    },
  });
}

export async function createDailyRequirement(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !["COCINERO", "OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const dateStr = formData.get("date") as string;
  const notes = formData.get("notes")?.toString() || null;

  if (!dateStr) {
    throw new Error("Fecha es requerida");
  }

  // ✅ Fix: Create date at noon to avoid timezone issues
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0); // Noon instead of midnight

  // Check if requirement already exists for this date (compare by date only)
  const existingRequirement = await prisma.dailyRequirement.findFirst({
    where: {
      date: {
        gte: new Date(year, month - 1, day, 0, 0, 0, 0),
        lt: new Date(year, month - 1, day + 1, 0, 0, 0, 0),
      },
    },
  });

  if (existingRequirement) {
    return {
      success: true,
      requirementId: existingRequirement.id,
      existed: true,
    };
  }

  const requirement = await prisma.dailyRequirement.create({
    data: {
      date,
      notes,
      createdById: user.id,
      status: "PENDING",
    },
  });

  revalidatePath("/settings");
  revalidatePath("/kitchen");
  return { success: true, requirementId: requirement.id, existed: false };
}

// Get pending requirements for settings page
export async function getDailyRequirements() {
  "use server";

  // ✅ Fix: Get today at noon to avoid timezone issues
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return await prisma.dailyRequirement.findMany({
    where: {
      date: {
        gte: today,
      },
      status: { not: "CANCELLED" },
    },
    include: {
      createdBy: { select: { name: true, role: true } },
      approvedBy: { select: { name: true } },
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });
}

// Add item to a requirement
export async function addRequirementItem(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !["COCINERO", "OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const requirementId = formData.get("requirementId")?.toString();
  const inventoryItemId = formData.get("inventoryItemId")?.toString();
  const quantityStr = formData.get("quantity")?.toString();
  const notes = formData.get("notes")?.toString() || null;

  if (!requirementId || !inventoryItemId || !quantityStr) {
    throw new Error("Datos inválidos");
  }

  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity) || quantity <= 0) {
    throw new Error("Cantidad inválida");
  }

  // ✅ Validate that inventory item exists
  const inventoryItem = await prisma.inventoryItem.findUnique({
    where: { id: inventoryItemId },
  });

  if (!inventoryItem) {
    throw new Error("El item de inventario no existe");
  }

  // ✅ Validate that requirement exists
  const requirement = await prisma.dailyRequirement.findUnique({
    where: { id: requirementId },
  });

  if (!requirement) {
    throw new Error("El requerimiento no existe");
  }

  // ✅ Check if this item already exists in the requirement
  const existingItem = await prisma.requirementItem.findUnique({
    where: {
      requirementId_inventoryItemId: {
        requirementId,
        inventoryItemId,
      },
    },
  });

  if (existingItem) {
    // Update existing item quantity instead of creating duplicate
    await prisma.requirementItem.update({
      where: {
        requirementId_inventoryItemId: {
          requirementId,
          inventoryItemId,
        },
      },
      data: {
        quantityRequested: { increment: quantity },
        notes: notes || existingItem.notes,
      },
    });
  } else {
    // Create new requirement item
    await prisma.requirementItem.create({
      data: {
        requirementId,
        inventoryItemId,
        quantityRequested: quantity,
        quantityDelivered: 0,
        notes,
      },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/kitchen");
}

// Deliver requirement item
export async function deliverRequirementItem(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const requirementItemId = formData.get("requirementItemId")?.toString();
  const quantityStr = formData.get("quantity")?.toString();

  if (!requirementItemId || !quantityStr) {
    throw new Error("Datos inválidos");
  }

  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity) || quantity <= 0) {
    throw new Error("Cantidad inválida");
  }

  await prisma.$transaction(async (tx) => {
    const requirementItem = await tx.requirementItem.findUnique({
      where: { id: requirementItemId },
      include: {
        requirement: true,
        inventoryItem: true,
      },
    });

    if (!requirementItem) {
      throw new Error("Requerimiento no encontrado");
    }

    const remainingToDeliver =
      requirementItem.quantityRequested - requirementItem.quantityDelivered;
    const deliverQuantity = Math.min(quantity, remainingToDeliver);

    if (deliverQuantity <= 0) {
      throw new Error("Ya se entregó la cantidad completa");
    }

    await tx.requirementItem.update({
      where: { id: requirementItemId },
      data: { quantityDelivered: { increment: deliverQuantity } },
    });

    const allItemsDelivered = await tx.requirementItem.findMany({
      where: { requirementId: requirementItem.requirementId },
    });

    const allFullyDelivered = allItemsDelivered.every(
      (item) => item.quantityDelivered >= item.quantityRequested,
    );

    await tx.dailyRequirement.update({
      where: { id: requirementItem.requirementId },
      data: {
        status: allFullyDelivered ? "DELIVERED" : "PARTIALLY_DELIVERED",
        approvedById: user.id,
      },
    });
  });

  revalidatePath("/settings");
  return { success: true };
}

// Cancel a requirement
export async function cancelRequirement(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const requirementId = formData.get("requirementId")?.toString();
  if (!requirementId) throw new Error("ID requerido");

  await prisma.dailyRequirement.update({
    where: { id: requirementId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/settings");
}
