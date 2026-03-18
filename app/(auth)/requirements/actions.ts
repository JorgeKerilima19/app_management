// app/(auth)/requirements/actions.ts
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
  date: string; // YYYY-MM-DD
  notes: string;
  items: Array<{
    inventoryItemId: string;
    quantity: number;
    notes: string;
  }>;
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

// ✅ Helper: Parse date string to America/Lima timezone (noon to avoid DST issues)
function parseDateToLima(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Set to noon in Lima time to avoid timezone boundary issues
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

// ✅ Helper: Get start of day in America/Lima (00:00:00)
function getStartOfDayLima(date: Date): Date {
  const limaDate = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Lima" }),
  );
  limaDate.setHours(0, 0, 0, 0);
  return limaDate;
}

// ✅ Helper: Get end of day in America/Lima (23:59:59)
function getEndOfDayLima(date: Date): Date {
  const limaDate = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Lima" }),
  );
  limaDate.setHours(23, 59, 59, 999);
  return limaDate;
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

export async function createDailyRequirement(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["CAJERO", "COCINERO", "OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const dateStr = formData.get("date") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!dateStr) throw new Error("Fecha es requerida");

  // ✅ Parse date with Lima timezone
  const date = parseDateToLima(dateStr);

  // ✅ Check for existing requirement on this date (Lima timezone)
  const startOfDay = getStartOfDayLima(date);
  const endOfDay = getEndOfDayLima(date);

  const existingRequirement = await prisma.dailyRequirement.findFirst({
    where: {
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
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

  // ✅ REMOVED: Status check - allow adding items to ANY requirement status
  // This allows cashiers to add items even after approval (common for nightly adjustments)

  const existingItem = await prisma.requirementItem.findUnique({
    where: {
      requirementId_inventoryItemId: { requirementId, inventoryItemId },
    },
  });

  if (existingItem) {
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

  // If this was the last item, optionally delete the empty requirement
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

export async function getDailyRequirements(filters?: {
  startDate?: Date;
  endDate?: Date;
  status?: string[];
}): Promise<DailyRequirement[]> {
  const whereClause: any = {
    status: { not: "CANCELLED" },
  };

  if (filters?.startDate) {
    // ✅ Convert to Lima timezone start of day
    whereClause.date = {
      ...whereClause.date,
      gte: getStartOfDayLima(filters.startDate),
    };
  }
  if (filters?.endDate) {
    // ✅ Convert to Lima timezone end of day
    whereClause.date = {
      ...whereClause.date,
      lte: getEndOfDayLima(filters.endDate),
    };
  }
  if (filters?.status?.length) {
    whereClause.status = { in: filters.status };
  }

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
    orderBy: { date: "asc" },
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

    await tx.inventoryItem.update({
      where: { id: requirementItem.inventoryItemId },
      data: { currentQuantity: { increment: deliverQuantity } },
    });

    await tx.requirementItem.update({
      where: { id: requirementItemId },
      data: { quantityDelivered: { increment: deliverQuantity } },
    });

    const allItems = await tx.requirementItem.findMany({
      where: { requirementId: requirementItem.requirementId },
    });

    const allFullyDelivered = allItems.every(
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

export async function approveRequirement(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const requirementId = formData.get("requirementId") as string;
  if (!requirementId) throw new Error("ID requerido");

  const requirement = await prisma.dailyRequirement.findUnique({
    where: { id: requirementId },
    include: { items: true },
  });

  if (!requirement) throw new Error("Requerimiento no encontrado");
  if (requirement.status !== "PENDING") {
    throw new Error("Solo se pueden aprobar requerimientos pendientes");
  }
  if (requirement.items.length === 0) {
    throw new Error("No se puede aprobar un requerimiento sin items");
  }

  await prisma.dailyRequirement.update({
    where: { id: requirementId },
    data: {
      status: "APPROVED",
      approvedById: user.id,
    },
  });

  revalidatePath("/requirements");
  return { success: true };
}
