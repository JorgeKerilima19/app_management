import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const logs = await prisma.wastageLog.findMany({
    include: { inventoryItem: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const { inventoryItemId, quantityLost, reason } = await req.json();

  if (!inventoryItemId || !quantityLost)
    return NextResponse.json({ error: "inventoryItemId and quantityLost required" }, { status: 400 });

  const log = await prisma.wastageLog.create({
    data: {
      inventoryItemId,
      quantityLost,
      reason: reason ?? "Unspecified"
    },
  });

  // Optional: decrement actual stock
  await prisma.inventoryItem.update({
    where: { id: inventoryItemId },
    data: { quantity: { decrement: quantityLost } },
  });

  return NextResponse.json(log);
}
