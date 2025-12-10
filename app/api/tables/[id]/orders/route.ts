import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  return NextResponse.redirect(
    new URL(`/dashboard/tables/${tableId}`, req.url)
  );
}

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tableId = searchParams.get("tableId");
  const status = searchParams.get("status");

  const where: any = {};
  if (tableId) where.tableId = Number(tableId);
  if (status) where.status = status;

  try {
    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        orderItems: { include: { menuItem: true } },
      },
    });
    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
