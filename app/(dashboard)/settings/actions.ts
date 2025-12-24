// app/(dashboard)/settings/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ===== TABLES =====
export async function createTable(formData: FormData) {
  const numberStr = formData.get("number") as string;
  const capacityStr = formData.get("capacity") as string;

  const number = parseInt(numberStr, 10);
  const capacity = parseInt(capacityStr, 10);

  if (isNaN(number) || isNaN(capacity)) return;
  if (![4, 6].includes(capacity)) return;

  // ✅ FIX: Use `where: { number }` — valid because `number` is @unique
  const exists = await prisma.table.findFirst({
    where: { number }, // ← This is now valid
  });

  if (exists) return;

  await prisma.table.create({
    data: { number, capacity },
  });
  revalidatePath("/settings");
}

export async function deleteTable(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.table.delete({ where: { id } });
  revalidatePath("/settings");
}
