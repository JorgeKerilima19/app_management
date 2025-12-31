// lib/auth.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

const SESSION_COOKIE = "user_id";

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const userId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!userId || typeof userId !== "string") return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  return user;
}

export async function requireAuthAndRedirect() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
