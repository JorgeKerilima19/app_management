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
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(body.password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const cookieHeader = createAuthCookie(token);

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
    console.log("Input password:", body.password);
    console.log("Stored hash in DB:", user.password);
    console.log(
      "Comparison result:",
      await bcrypt.compare(body.password, user.password)
    );
    return new NextResponse(JSON.stringify({ user: safeUser }), {
      status: 200,
      headers: {
        "Set-Cookie": cookieHeader,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
