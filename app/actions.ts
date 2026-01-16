// app/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { SESSION_COOKIE, COOKIE_OPTIONS } from "@/lib/auth";

export type LoginState = {
  success: boolean;
  message?: string;
};

export async function login(
  _: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { success: false, message: "Email y contraseña son requeridos" };
  }

  if (email.length === 0 || password.length === 0) {
    return {
      success: false,
      message: "Email y contraseña no pueden estar vacíos",
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { success: false, message: "Email o contraseña inválidos" };
  }

  (await cookies()).set(SESSION_COOKIE, user.id, COOKIE_OPTIONS);

  // Role-based redirect
  switch (user.role) {
    case "OWNER":
    case "ADMIN":
      redirect("/inventory");
    case "MESERO":
      redirect("/tables");
    case "COCINERO":
      redirect("/kitchen");
    case "BARISTA":
      redirect("/bar");
    case "CAJERO":
      redirect("/cashier");
    default:
      redirect("/login");
  }
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// Register action (for first user)
export async function register(_: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "Todos los campos son requeridos" };
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
      role: "OWNER",
    },
  });

  redirect("/login");
}
