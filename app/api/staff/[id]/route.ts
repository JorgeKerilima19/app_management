import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const staff = await prisma.staff.findUnique({
    where: { id: Number(params.id) },
  });

  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  return NextResponse.json(staff);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();

  const updated = await prisma.staff.update({
    where: { id: Number(params.id) },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.staff.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ message: "Staff deleted" });
}
