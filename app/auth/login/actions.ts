"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function loginAction(formData: FormData): Promise<void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) throw new Error("Email y contraseña son requeridos");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Credenciales inválidas");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Credenciales inválidas");

  const token = JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const c = await cookies();
  c.set("auth_token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  // No need to return anything
}
