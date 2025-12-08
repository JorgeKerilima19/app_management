import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { menuItemId, inventoryItemId, quantityUsed } = await req.json();

  const link = await prisma.menuItemInventoryLink.create({
    data: {
      menuItemId,
      inventoryItemId,
      quantityUsed: Number(quantityUsed),
    },
  });

  return NextResponse.json(link);
}
