// app/(dashboard)/settings/tables/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTableAction(formData: FormData) {
  const numberStr = formData.get("number") as string;
  const capacityStr = formData.get("capacity") as string;

  const number = parseInt(numberStr, 10);
  const capacity = parseInt(capacityStr, 10);

  if (isNaN(number) || isNaN(capacity)) return;
  if (![4, 6].includes(capacity)) return;

  // ✅ Use findFirst instead of findUnique
  const exists = await prisma.table.findFirst({ where: { number } });
  if (exists) return;

  await prisma.table.create({
    data: { number, capacity },
  });

  revalidatePath("/settings/tables");
}

export async function updateTableAction(formData: FormData) {
  const id = formData.get("id") as string;
  const numberStr = formData.get("number") as string;
  const capacityStr = formData.get("capacity") as string;

  const number = parseInt(numberStr, 10);
  const capacity = parseInt(capacityStr, 10);

  if (isNaN(number) || isNaN(capacity)) return;
  if (![4, 6].includes(capacity)) return;

  // Ensure no other table has this number
  const existing = await prisma.table.findFirst({
    where: { number, NOT: { id } },
  });
  if (existing) return;

  await prisma.table.update({
    where: { id },
    data: { number, capacity },
  });

  revalidatePath("/settings/tables");
}

export async function deleteTableAction(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.table.delete({
    where: { id },
  });
  revalidatePath("/settings/tables");
}
