/// app/(auth)/storage/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function createStorageItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const name = (formData.get("name") as string)?.trim();
  const quantityStr = formData.get("currentQuantity") as string;
  const unit = (formData.get("unit") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;
  const costStr = formData.get("costPerUnit") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name || !quantityStr || !unit) {
    throw new Error("Nombre, cantidad y unidad son requeridos");
  }

  const currentQuantity = parseFloat(quantityStr);
  if (isNaN(currentQuantity) || currentQuantity < 0) {
    throw new Error("Cantidad inválida");
  }

  const costPerUnit = costStr ? parseFloat(costStr) : null;

  await prisma.$transaction(async (tx) => {
    // Create storage item
    const storageItem = await tx.storageItem.create({
      data: {
        name,
        currentQuantity,
        unit,
        category,
        costPerUnit: costPerUnit !== null ? costPerUnit : undefined,
        notes,
      },
    });

    let inventoryItem = await tx.inventoryItem.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (!inventoryItem) {
      inventoryItem = await tx.inventoryItem.create({
        data: {
          name,
          currentQuantity: 0,
          unit,
          category,
        },
      });
    }

    // Log storage transaction
    await tx.storageTransaction.create({
      data: {
        storageItemId: storageItem.id,
        type: "PURCHASE",
        quantityChange: currentQuantity,
        reason: "Compra inicial",
        performedById: user.id,
      },
    });
  });

  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });

  if (inventoryItem && category) {
    await prisma.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: { category },
    });
  }

  revalidatePath("/storage");
  revalidatePath("/inventory");
}

export async function updateStorageItem(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString();
  const quantityStr = formData.get("currentQuantity")?.toString();
  const unit = formData.get("unit")?.toString();
  const category = formData.get("category")?.toString();
  const costStr = formData.get("costPerUnit")?.toString();
  const notes = formData.get("notes")?.toString();

  if (!id || !name || !quantityStr || !unit) {
    throw new Error("Datos inválidos");
  }

  const currentQuantity = parseFloat(quantityStr);
  if (isNaN(currentQuantity) || currentQuantity < 0) {
    throw new Error("Cantidad inválida");
  }

  const costPerUnit = costStr ? parseFloat(costStr) : null;

  await prisma.storageItem.update({
    where: { id },
    data: {
      name,
      currentQuantity,
      unit,
      category: category?.trim() || null,
      costPerUnit: costPerUnit !== null ? costPerUnit : undefined,
      notes: notes?.trim() || null,
    },
  });

  revalidatePath("/storage");
  revalidatePath("/inventory");
}

export async function deleteStorageItem(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const id = formData.get("id")?.toString();
  if (!id) throw new Error("ID requerido");

  await prisma.storageItem.delete({ where: { id } });

  revalidatePath("/storage");
  revalidatePath("/inventory");
}

export async function addStorageQuantity(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const storageItemId = formData.get("storageItemId")?.toString();
  const quantityStr = formData.get("quantity")?.toString();
  const reason = formData.get("reason")?.toString() || "Reposición";

  if (!storageItemId || !quantityStr) {
    throw new Error("Datos inválidos");
  }

  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity) || quantity <= 0) {
    throw new Error("Cantidad inválida");
  }

  await prisma.$transaction(async (tx) => {
    await tx.storageItem.update({
      where: { id: storageItemId },
      data: { currentQuantity: { increment: quantity } },
    });

    await tx.storageTransaction.create({
      data: {
        storageItemId,
        type: "PURCHASE",
        quantityChange: quantity,
        reason,
        performedById: user.id,
      },
    });
  });

  revalidatePath("/storage");
  revalidatePath("/inventory");
}

export async function transferToInventory(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const storageItemId = formData.get("storageItemId")?.toString();
  const inventoryItemId = formData.get("inventoryItemId")?.toString();
  const quantityStr = formData.get("quantity")?.toString();
  const reason =
    formData.get("reason")?.toString() || "Transferencia desde almacén";

  if (!storageItemId || !inventoryItemId || !quantityStr) {
    throw new Error("Datos inválidos");
  }

  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity) || quantity <= 0) {
    throw new Error("Cantidad inválida");
  }

  await prisma.$transaction(async (tx) => {
    // Check storage has enough stock
    const storageItem = await tx.storageItem.findUnique({
      where: { id: storageItemId },
    });

    if (!storageItem || storageItem.currentQuantity < quantity) {
      throw new Error("Stock insuficiente en almacén");
    }

    // Check inventory item exists
    const inventoryItem = await tx.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!inventoryItem) {
      throw new Error("Item de inventario no encontrado");
    }

    // Deduct from storage
    await tx.storageItem.update({
      where: { id: storageItemId },
      data: { currentQuantity: { decrement: quantity } },
    });

    // Add to inventory
    await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { currentQuantity: { increment: quantity } },
    });

    // Log storage transaction
    await tx.storageTransaction.create({
      data: {
        storageItemId,
        type: "TRANSFER_TO_INVENTORY",
        quantityChange: -quantity,
        referenceModel: "InventoryItem",
        referenceId: inventoryItemId,
        reason,
        performedById: user.id,
      },
    });
  });

  revalidatePath("/storage");
  revalidatePath("/inventory");
  return { success: true };
}

export async function getLinkedInventoryItem(storageItemName: string) {
  return await prisma.inventoryItem.findFirst({
    where: { name: { equals: storageItemName, mode: "insensitive" } },
    select: { id: true, name: true, currentQuantity: true, unit: true },
  });
}

export async function syncCategoriesFromStorage(formData: FormData) {
  try {
    const user = await getCurrentUser();
    console.log("👤 User:", user?.email, user?.role);

    if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
      console.error("❌ Unauthorized");
      throw new Error("No autorizado");
    }

    const storageItems = await prisma.storageItem.findMany({
      where: {
        category: {
          not: null,
        },
      },
      select: {
        name: true,
        category: true,
      },
    });

    storageItems.forEach((item) =>
      console.log(`  - ${item.name}: ${item.category}`),
    );

    // Fetch inventory items WITHOUT categories
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        category: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(
      `📋 Found ${inventoryItems.length} inventory items without categories:`,
    );
    inventoryItems.forEach((item) => console.log(`  - ${item.name}`));

    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const storageItem of storageItems) {
        const inventoryItem = await tx.inventoryItem.findFirst({
          where: {
            name: {
              equals: storageItem.name,
              mode: "insensitive",
            },
            category: null, // Only update items without category
          },
        });

        if (inventoryItem) {
          await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: {
              category: storageItem.category,
            },
          });
          updatedCount++;
        } else {
          console.log(`No match for "${storageItem.name}"`);
        }
      }
    });

    revalidatePath("/storage");
    revalidatePath("/inventory");
  } catch (error) {
    console.error("❌ SYNC FAILED:", error);
    throw error;
  }
}
