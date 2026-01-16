// app/inventory/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return parseFloat(value.toString());
}

export async function createInventoryItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const name = (formData.get("name") as string)?.trim();
  const quantityStr = formData.get("quantity") as string;
  const unit = (formData.get("unit") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

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
      quantity,
      unit,
      category,
      notes,
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
  const quantityStr = formData.get("quantity")?.toString();
  const unit = formData.get("unit")?.toString();
  const category = formData.get("category")?.toString();
  const notes = formData.get("notes")?.toString();

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
        quantity,
        unit,
        category: category?.trim() || null,
        notes: notes?.trim() || null,
      },
    });
    revalidatePath("/inventory");
    revalidatePath(`/inventory/${id}`);
  } catch (error) {
    console.error("Update error:", error);
    throw new Error("Error al actualizar el item");
  }
}
