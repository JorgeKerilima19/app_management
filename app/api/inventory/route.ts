import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const items = await prisma.inventoryItem.findMany();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, category, unit, currentStock, minStock, isConsumable } =
    await req.json();

  const item = await prisma.inventoryItem.create({
    data: {
      name,
      category,
      unit,
      currentStock: Number(currentStock),
      minStock: Number(minStock),
      isConsumable: isConsumable ?? true,
    },
  });

  return NextResponse.json(item);
}
