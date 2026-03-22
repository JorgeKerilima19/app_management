"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type InventoryItem = {
  id: string;
  name: string;
  currentQuantity: number;
  unit: string;
  category: string | null;
  costPerUnit: number | null;
  lowStockThreshold: number | null;
};

export type RequirementItem = {
  id: string;
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  quantityRequested: number;
  quantityDelivered: number;
  notes: string | null;
};

export type DailyRequirement = {
  id: string;
  date: Date;
  // ✅ Include ALL statuses from Prisma enum
  status:
    | "PENDING"
    | "APPROVED"
    | "PARTIALLY_DELIVERED"
    | "DELIVERED"
    | "CANCELLED";
  notes: string | null;
  createdById: string;
  createdBy: { id: string; name: string; role: string };
  approvedById: string | null;
  approvedBy: { id: string; name: string } | null;
  items: RequirementItem[];
  createdAt: Date;
  updatedAt: Date;
};

export type RequirementFormData = {
  date: string;
  notes: string;
  items: Array<{ inventoryItemId: string; quantity: number; notes: string }>;
};

export type DeliverFormData = {
  requirementItemId: string;
  quantity: number;
};

function toNumber(value: any): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (value && typeof value.toNumber === "function") return value.toNumber();
  return parseFloat(value.toString());
}

export async function getInventoryItemsForRequirements(): Promise<
  InventoryItem[]
> {
  const items = await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      currentQuantity: true,
      unit: true,
      category: true,
      costPerUnit: true,
      lowStockThreshold: true,
    },
  });

  return items.map((item) => ({
    ...item,
    currentQuantity: Number(item.currentQuantity),
    costPerUnit: toNumber(item.costPerUnit),
    lowStockThreshold: toNumber(item.lowStockThreshold),
  }));
}

// ✅ Create new requirement OR return existing one (allows adding items later)
export async function createDailyRequirement(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["CAJERO", "COCINERO", "OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const dateStr = formData.get("date") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!dateStr) throw new Error("Fecha es requerida");

  // Parse date for @db.Date field (Prisma truncates time)
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day)); // midnight UTC

  // ✅ Check for existing requirement on this date
  const existingRequirement = await prisma.dailyRequirement.findFirst({
    where: {
      date: { equals: date },
    },
  });

  if (existingRequirement) {
    return {
      success: true,
      requirementId: existingRequirement.id,
      existed: true,
      message: "Ya existe un requerimiento para esta fecha",
    };
  }

  // Create new requirement (without items - they're added separately)
  const requirement = await prisma.dailyRequirement.create({
    data: {
      date,
      notes,
      createdById: user.id,
      status: "PENDING",
    },
  });

  revalidatePath("/requirements");
  return {
    success: true,
    requirementId: requirement.id,
    existed: false,
    message: "Requerimiento creado",
  };
}

// ✅ Add item to existing requirement (works for ANY status)
export async function addRequirementItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["CAJERO", "COCINERO", "OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const requirementId = formData.get("requirementId") as string;
  const inventoryItemId = formData.get("inventoryItemId") as string;
  const quantityStr = formData.get("quantity") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!requirementId || !inventoryItemId || !quantityStr) {
    throw new Error("Datos inválidos");
  }

  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity) || quantity <= 0) {
    throw new Error("Cantidad inválida");
  }

  const [inventoryItem, requirement] = await Promise.all([
    prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } }),
    prisma.dailyRequirement.findUnique({ where: { id: requirementId } }),
  ]);

  if (!inventoryItem) throw new Error("Item de inventario no encontrado");
  if (!requirement) throw new Error("Requerimiento no encontrado");

  // ✅ Check for existing item (same requirement + inventory item)
  const existingItem = await prisma.requirementItem.findUnique({
    where: {
      requirementId_inventoryItemId: { requirementId, inventoryItemId },
    },
  });

  if (existingItem) {
    // ✅ Update: increment quantityRequested
    await prisma.requirementItem.update({
      where: {
        requirementId_inventoryItemId: { requirementId, inventoryItemId },
      },
      data: {
        quantityRequested: { increment: quantity },
        notes: notes || existingItem.notes,
      },
    });
  } else {
    // ✅ Create new item
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

  revalidatePath("/requirements");
  return { success: true };
}

export async function removeRequirementItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const requirementItemId = formData.get("requirementItemId") as string;
  if (!requirementItemId) throw new Error("ID requerido");

  const requirementItem = await prisma.requirementItem.findUnique({
    where: { id: requirementItemId },
    include: { requirement: true },
  });

  if (!requirementItem) throw new Error("Item no encontrado");

  await prisma.requirementItem.delete({ where: { id: requirementItemId } });

  const remainingItems = await prisma.requirementItem.count({
    where: { requirementId: requirementItem.requirementId },
  });

  if (remainingItems === 0) {
    await prisma.dailyRequirement.delete({
      where: { id: requirementItem.requirementId },
    });
  }

  revalidatePath("/requirements");
  revalidatePath("/settings");
  return { success: true };
}

// ✅ Fetch requirements: 36-hour UTC window, proper @db.Date handling
export async function getDailyRequirements(filters?: {
  hoursWindow?: number;
  // status filter removed - we show everything
}): Promise<DailyRequirement[]> {
  const whereClause: any = {};

  if (filters?.hoursWindow) {
    // ✅ Simple: fetch by createdAt (timestamp) instead of date (@db.Date)
    // createdAt is DateTime (with time), so range queries work reliably
    const now = new Date();
    const startTime = new Date(
      now.getTime() - filters.hoursWindow * 60 * 60 * 1000,
    );

    whereClause.createdAt = {
      gte: startTime,
      lte: now,
    };
  }

  // ✅ NO status filter - show PENDING, APPROVED, DELIVERED, CANCELLED, all of them

  const requirements = await prisma.dailyRequirement.findMany({
    where: whereClause,
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      approvedBy: { select: { id: true, name: true } },
      items: {
        include: {
          inventoryItem: {
            select: {
              id: true,
              name: true,
              currentQuantity: true,
              unit: true,
              category: true,
              costPerUnit: true,
              lowStockThreshold: true,
            },
          },
        },
        orderBy: { inventoryItem: { name: "asc" } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return requirements.map((req) => ({
    ...req,
    items: req.items.map((item) => ({
      ...item,
      quantityRequested: Number(item.quantityRequested),
      quantityDelivered: Number(item.quantityDelivered),
      inventoryItem: {
        ...item.inventoryItem,
        currentQuantity: Number(item.inventoryItem.currentQuantity),
        costPerUnit: toNumber(item.inventoryItem.costPerUnit),
        lowStockThreshold: toNumber(item.inventoryItem.lowStockThreshold),
      },
    })),
  }));
}

export async function deliverRequirementItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const requirementItemId = formData.get("requirementItemId") as string;
  const quantityStr = formData.get("quantity") as string;

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

    if (!requirementItem) throw new Error("Requerimiento no encontrado");

    const remainingToDeliver =
      requirementItem.quantityRequested - requirementItem.quantityDelivered;
    const deliverQuantity = Math.min(quantity, remainingToDeliver);

    if (deliverQuantity <= 0) {
      throw new Error("Ya se entregó la cantidad completa");
    }

    // Deduct from storage if available
    const storageItem = await tx.storageItem.findFirst({
      where: {
        name: {
          equals: requirementItem.inventoryItem.name,
          mode: "insensitive",
        },
        currentQuantity: { gte: deliverQuantity },
      },
    });

    if (storageItem) {
      await tx.storageItem.update({
        where: { id: storageItem.id },
        data: { currentQuantity: { decrement: deliverQuantity } },
      });

      await tx.storageTransaction.create({
        data: {
          storageItemId: storageItem.id,
          type: "TRANSFER_TO_INVENTORY",
          quantityChange: -deliverQuantity,
          referenceModel: "RequirementItem",
          referenceId: requirementItemId,
          reason: `Entregado para requerimiento #${requirementItem.requirementId.slice(-6)}`,
          performedById: user.id,
        },
      });
    }

    // Add to inventory
    await tx.inventoryItem.update({
      where: { id: requirementItem.inventoryItemId },
      data: { currentQuantity: { increment: deliverQuantity } },
    });

    // Update requirement item
    await tx.requirementItem.update({
      where: { id: requirementItemId },
      data: { quantityDelivered: { increment: deliverQuantity } },
    });

    const allItems = await tx.requirementItem.findMany({
      where: { requirementId: requirementItem.requirementId },
    });
    const EPSILON = 0.001;
    const allFullyDelivered = allItems.every(
      (item) => item.quantityDelivered >= item.quantityRequested - EPSILON,
    );

    const newStatus = allFullyDelivered ? "DELIVERED" : "PARTIALLY_DELIVERED";

    await tx.dailyRequirement.update({
      where: { id: requirementItem.requirementId },
      data: {
        status: newStatus,
        approvedById: user.id, // Track who delivered
      },
    });

    // ✅ Debug log (visible in server terminal)
    console.log("📦 Delivery update:", {
      requirementId: requirementItem.requirementId,
      totalItems: allItems.length,
      deliveredItems: allItems.filter(
        (i) => i.quantityDelivered >= i.quantityRequested - EPSILON,
      ).length,
      newStatus,
    });
  });

  revalidatePath("/requirements");
  revalidatePath("/inventory");
  return { success: true };
}

export async function cancelRequirement(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const requirementId = formData.get("requirementId") as string;
  if (!requirementId) throw new Error("ID requerido");

  const requirement = await prisma.dailyRequirement.findUnique({
    where: { id: requirementId },
  });

  if (!requirement) throw new Error("Requerimiento no encontrado");
  if (requirement.status !== "PENDING") {
    throw new Error("Solo se pueden cancelar requerimientos pendientes");
  }

  await prisma.dailyRequirement.update({
    where: { id: requirementId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/requirements");
  return { success: true };
}
