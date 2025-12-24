// app/(dashboard)/settings/staff/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function addStaffAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!name || !email || !password || !role) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const validRoles = ["MESERO", "COCINERO", "CAJERO", "MANAGER"];
  if (!validRoles.includes(role)) {
    return { error: "Invalid role" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email already in use" };
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, password: hashed, role: role as any },
  });

  revalidatePath("/settings/staff");
  return { success: true };
}

export async function deleteStaffAction(formData: FormData) {
  const id = formData.get("id") as string;

  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.role === "OWNER") {
    return { error: "Cannot delete owner account" };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings/staff");
  return { success: true };
}
