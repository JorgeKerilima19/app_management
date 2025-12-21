// app/(dashboard)/inventory/edit-inventory/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createInventoryItem(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const quantityStr = formData.get("quantity") as string;
  const unit = (formData.get("unit") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name || !quantityStr || !unit) return;

  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity)) return;

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
  revalidatePath("/inventory/edit-inventory");
}

export async function updateInventoryItem(formData: FormData) {
  const id = formData.get("id")?.toString(); // ✅ Safe conversion
  const name = formData.get("name")?.toString();
  const quantityStr = formData.get("quantity")?.toString();
  const unit = formData.get("unit")?.toString();

  if (!id || !name || !quantityStr || !unit) {
    throw new Error("Missing required fields");
  }

  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity)) {
    throw new Error("Invalid quantity");
  }

  try {
    await prisma.inventoryItem.update({
      where: { id },
      data: { name, quantity, unit },
    });
    revalidatePath("/inventory");
  } catch (error) {
    console.error("Update error:", error);
    throw new Error("Failed to update item");
  }
}

export async function deleteInventoryItem(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath("/inventory");
  revalidatePath("/inventory/edit-inventory");
}
