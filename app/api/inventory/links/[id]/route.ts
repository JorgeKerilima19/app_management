import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quantityUsed } = await req.json();

  const updated = await prisma.menuItemInventoryLink.update({
    where: { id: Number(params.id) },
    data: { quantityUsed: Number(quantityUsed) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.menuItemInventoryLink.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ deleted: true });
}
