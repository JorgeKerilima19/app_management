"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  await prisma.category.create({ data: { name } });
  revalidatePath("/settings");
}

export async function deleteCategory(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.category.delete({ where: { id } });
  revalidatePath("/settings");
}
