// app/(dashboard)/settings/menu/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ===== CATEGORIES =====
export async function createCategoryAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  await prisma.category.create({
    data: { name },
  });

  revalidatePath("/settings/menu");
}

export async function deleteCategory(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.category.delete({ where: { id } });
  revalidatePath("/settings/menu");
}

// ===== MENU ITEMS =====
export async function createMenuItemAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const priceStr = formData.get("price") as string;
  const categoryId = formData.get("categoryId") as string;
  const isAvailable = formData.has("isAvailable");
  const prepTimeMin = formData.get("prepTimeMin") as string;

  if (!name || !priceStr || !categoryId) return;

  const price = parseFloat(priceStr);
  if (isNaN(price)) return;

  await prisma.menuItem.create({
    data: {
      name,
      description,
      price,
      isAvailable,
      prepTimeMin: prepTimeMin ? parseInt(prepTimeMin, 10) : null,
      categoryId,
    },
  });
  revalidatePath("/settings/menu");
}

export async function updateMenuItemAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const priceStr = formData.get("price") as string;
  const isAvailable = formData.has("isAvailable");
  const prepTimeMin = formData.get("prepTimeMin") as string;

  if (!id || !name || !priceStr) {
    throw new Error("Name and price are required");
  }

  const price = parseFloat(priceStr);
  if (isNaN(price)) {
    throw new Error("Invalid price");
  }

  const prepTime = prepTimeMin ? parseInt(prepTimeMin, 10) : null;

  await prisma.menuItem.update({
    where: { id },
    data: {
      name,
      description,
      price,
      isAvailable,
      prepTimeMin: prepTime,
    },
  });

  revalidatePath("/settings/menu");
}

export async function deleteMenuItem(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.menuItem.delete({ where: { id } });
  revalidatePath("/settings/menu");
}
