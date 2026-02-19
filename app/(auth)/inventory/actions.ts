// app/inventory/actions.ts
"use server"

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
        currentQuantity: quantity, // ✅ Map form "quantity" → schema "currentQuantity"
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
