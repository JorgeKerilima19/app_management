// app/(dashboard)/kitchen/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ✅ Mark order as ready
export async function markOrderAsReady(formData: FormData) {
  const orderId = formData.get("orderId") as string;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "READY",
    },
  });

  revalidatePath("/kitchen");
}

// ✅ Optional: explicit refresh action (not needed if using meta refresh)
export async function refreshKitchen() {
  revalidatePath("/kitchen");
}
