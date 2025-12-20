// app/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ✅ Define error return type
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

  // ✅ Validation
  if (typeof email !== "string" || typeof password !== "string") {
    return { success: false, message: "Email and password are required" };
  }

  if (email.length === 0 || password.length === 0) {
    return { success: false, message: "Email and password cannot be empty" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { success: false, message: "Invalid email or password" };
  }

  (await cookies()).set("user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
  });

  // ✅ Success → redirect (but useFormState won't see this)
  redirect("/dashboard");

  // Note: redirect() throws an error internally, so code below won't run
  // But TypeScript needs a return — so we add this (it's never reached)
  return { success: true };
}
