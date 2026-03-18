// app/inventory/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function createInventoryItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const name = (formData.get("name") as string)?.trim();
  const quantityStr = formData.get("quantity") as string; // ✅ Form field name
  const unit = (formData.get("unit") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const lowStockStr = formData.get("lowStockThreshold") as string;
  const costStr = formData.get("costPerUnit") as string;

  if (!name || !quantityStr || !unit) {
    throw new Error("Nombre, cantidad y unidad son requeridos");
  }

  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity) || quantity < 0) {
    throw new Error("Cantidad inválida");
  }

  await prisma.inventoryItem.create({
    data: {
      name,
      currentQuantity: quantity, // ✅ Map form "quantity" → schema "currentQuantity"
      unit,
      category,
      notes,
      lowStockThreshold: lowStockStr ? parseFloat(lowStockStr) : null,
      costPerUnit: costStr ? parseFloat(costStr) : null,
    },
  });

  revalidatePath("/inventory");
}

export async function updateInventoryItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString();
  const quantityStr = formData.get("quantity")?.toString(); // ✅ Form field name
  const unit = formData.get("unit")?.toString();
  const category = formData.get("category")?.toString();
  const notes = formData.get("notes")?.toString();

  // ✅ New optional fields
  const lowStockStr = formData.get("lowStockThreshold") as string;
  const costStr = formData.get("costPerUnit") as string;

  if (!id || !name || !quantityStr || !unit) {
    throw new Error("Nombre, cantidad y unidad son requeridos");
  }

  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity) || quantity < 0) {
    throw new Error("Cantidad inválida");
  }

  try {
    await prisma.inventoryItem.update({
      where: { id },
      data: {
        name,
        currentQuantity: quantity,
        unit,
        category: category?.trim() || null,
        notes: notes?.trim() || null,
        lowStockThreshold: lowStockStr ? parseFloat(lowStockStr) : null,
        costPerUnit: costStr ? parseFloat(costStr) : null,
      },
    });
    revalidatePath("/inventory");
    revalidatePath(`/inventory/${id}`);
  } catch (error) {
    console.error("Update error:", error);
    throw new Error("Error al actualizar el item");
  }
}

export async function recordSupplyUsage(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const inventoryItemId = formData.get("inventoryItemId") as string;
  const quantityStr = formData.get("quantity") as string;
  const reason = (formData.get("reason") as string) || "Uso de suministros";
  const adjustmentType = formData.get("adjustmentType") as
    | "USAGE"
    | "RESTOCK"
    | "CORRECTION";

  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity) || quantity <= 0) {
    throw new Error("Cantidad inválida");
  }

  await prisma.$transaction(async (tx) => {
    // Update inventory quantity (positive for restock, negative for usage)
    const change = adjustmentType === "RESTOCK" ? quantity : -quantity;

    await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { currentQuantity: { increment: change } },
    });

    // Log the transaction with proper type
    await tx.inventoryTransaction.create({
      data: {
        inventoryItemId,
        type: adjustmentType === "RESTOCK" ? "RESTOCK" : "MANUAL_ADJUSTMENT",
        quantityChange: change,
        referenceModel: "SupplyAdjustment",
        reason: `${adjustmentType}: ${reason}`,
        performedById: user.id,
      },
    });
  });

  revalidatePath("/inventory");
  return { success: true };
}
export async function getItemTransactionHistory(inventoryItemId: string) {
  return await prisma.inventoryTransaction.findMany({
    where: { inventoryItemId },
    orderBy: { createdAt: "desc" },
    include: {
      performedBy: { select: { name: true } },
    },
    take: 50, // Last 50 transactions
  });
}
export async function recordSupplyAdjustment(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const inventoryItemId = formData.get("inventoryItemId") as string;
  const quantityStr = formData.get("quantity") as string;
  const reason = (formData.get("reason") as string)?.trim() || "Ajuste manual";
  const type = formData.get("type") as "USAGE" | "RESTOCK"; // USAGE subtracts, RESTOCK adds

  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity) || quantity <= 0) {
    throw new Error("Cantidad inválida");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update Quantity (Negative for usage, Positive for restock)
    const change = type === "RESTOCK" ? quantity : -quantity;

    await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { currentQuantity: { increment: change } },
    });

    // 2. Log Transaction
    await tx.inventoryTransaction.create({
      data: {
        inventoryItemId,
        type: type === "RESTOCK" ? "RESTOCK" : "MANUAL_ADJUSTMENT",
        quantityChange: change,
        referenceModel: "SupplyAdjustment",
        reason: `${type === "USAGE" ? "Uso registrado" : "Reposición"}: ${reason}`,
        performedById: user.id,
      },
    });
  });

  revalidatePath("/inventory");
  return { success: true };
}

// Helper for Excel export to fetch recent manual adjustments
export async function getRecentManualAdjustments() {
  "use server";
  return await prisma.inventoryTransaction.findMany({
    where: {
      type: { in: ["MANUAL_ADJUSTMENT", "RESTOCK"] },
      referenceModel: "SupplyAdjustment",
    },
    include: {
      inventoryItem: { select: { name: true, category: true } },
      performedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500, // Last 500 records
  });
}
