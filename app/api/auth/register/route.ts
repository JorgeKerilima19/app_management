// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

type Body = {
  email: string;
  password: string;
  name: string;
  role?: string; // optionally allow specifying role (ADMIN, WAITER, etc.)
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    if (!body.email || !body.password || !body.name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(body.password, salt);

    const role = (body.role || "WAITER").toUpperCase();

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashed,
        name: body.name,
        role: role as any, // Prisma enum type coercion
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("REGISTER ERROR", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
