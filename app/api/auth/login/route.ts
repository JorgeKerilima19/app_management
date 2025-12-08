// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken, createAuthCookie } from "@/lib/auth";

type Body = {
  email: string;
  password: string;
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      // do not reveal which part is wrong for security
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(body.password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create JWT payload: minimal info, avoid sensitive data
    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    const cookieHeader = createAuthCookie(token);

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };

    return new NextResponse(JSON.stringify({ user: safeUser }), {
      status: 200,
      headers: {
        "Set-Cookie": cookieHeader,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
