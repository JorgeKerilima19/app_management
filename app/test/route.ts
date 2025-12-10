import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    console.log("Users:", users);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}