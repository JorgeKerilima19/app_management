// app/(dashboard)/settings/staff/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function addStaffAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const role = formData.get("role") as string;

  if (!name || !email || !role) {
    throw new Error("All fields are required");
  }

  const validRoles = ["WAITER", "CHEF", "CASHIER", "MANAGER"];
  if (!validRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email already in use");
  }

  // In production: generate random password + email invite
  const tempPassword = "restaurant123";
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role as any,
    },
  });

  revalidatePath("/settings/staff");
}

export async function removeStaffAction(formData: FormData) {
  const id = formData.get("id") as string;

  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.role === "OWNER") {
    throw new Error("Cannot delete owner");
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings/staff");
}
