// app/(dashboard)/settings/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createMenuItem(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const priceStr = formData.get("price") as string;
  const categoryId = formData.get("categoryId") as string;
  const isAvailable = formData.get("isAvailable") !== null;
  const prepTimeMin = formData.get("prepTimeMin") as string;

  if (!name || !priceStr || !categoryId) return;

  const price = parseFloat(priceStr);
  const prepTime = prepTimeMin ? parseInt(prepTimeMin, 10) : null;

  if (isNaN(price)) return;

  await prisma.menuItem.create({
    data: {
      name,
      description,
      price,
      isAvailable,
      prepTimeMin: prepTime,
      categoryId,
    },
  });
  revalidatePath("/settings");
}

export async function deleteMenuItem(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.menuItem.delete({ where: { id } });
  revalidatePath("/settings");
}
