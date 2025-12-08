// app/api/users/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET ALL USERS
export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// CREATE USER
export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, password, name, role } = body;

  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        password,
        name,
        role, // <-- enum UserRole
      },
    });

    return NextResponse.json(newUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
