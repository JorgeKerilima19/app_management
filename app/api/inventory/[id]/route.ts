import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: Number(params.id) },
  });

  if (!item)
    return NextResponse.json({ error: "Item not found" }, { status: 404 });

  return NextResponse.json(item);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  const updated = await prisma.inventoryItem.update({
    where: { id: Number(params.id) },
    data: {
      name: data.name,
      category: data.category,
      unit: data.unit,
      currentStock:
        data.currentStock !== undefined ? Number(data.currentStock) : undefined,
      minStock: data.minStock !== undefined ? Number(data.minStock) : undefined,
      isConsumable: data.isConsumable,
    },
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

  await prisma.inventoryItem.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ deleted: true });
}
