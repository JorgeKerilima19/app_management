import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const mod = await prisma.modifier.findUnique({
    where: { id: Number(params.id) },
  });

  if (!mod) return NextResponse.json({ error: "Modifier not found" }, { status: 404 });

  return NextResponse.json(mod);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();

  const updated = await prisma.modifier.update({
    where: { id: Number(params.id) },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.modifier.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ message: "Modifier deleted" });
}
