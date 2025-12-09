"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export type LoginState = {
  message: string;
  success?: boolean;
};

export async function loginAction(
  prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { message: "Email y contraseña son requeridos" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: "Email o contraseña inválidos" };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return { message: "Email o contraseña inválidos" };
  }

  const token = JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const c = await cookies();
  c.set("auth_token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { message: "Inicio exitoso", success: true };
}
