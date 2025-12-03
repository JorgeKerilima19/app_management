import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const modifiers = await prisma.modifier.findMany();
  return NextResponse.json(modifiers);
}

export async function POST(req: Request) {
  const { name, priceDelta } = await req.json();

  if (!name)
    return NextResponse.json({ error: "Modifier name required" }, { status: 400 });

  const mod = await prisma.modifier.create({
    data: { name, priceDelta: priceDelta ?? 0 },
  });

  return NextResponse.json(mod);
}
