// app/api/tables/[id]/orders/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const tableId = Number(params.id);
  if (isNaN(tableId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Check for existing open order
  const existing = await prisma.order.findFirst({
    where: { tableId, status: "OPEN" },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const order = await prisma.order.create({
    data: { tableId, status: "OPEN" },
  });

  return NextResponse.json(order);
}

// Optional: GET all orders for table (used above)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const tableId = Number(params.id);
  const orders = await prisma.order.findMany({
    where: { tableId },
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: { include: { menuItem: true } }
    }
  });
  return NextResponse.json(orders);
}