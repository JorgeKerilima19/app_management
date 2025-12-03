import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const order = await prisma.orders.findUnique({
      where: { id },
      include: { order_items: true, payments: true, table_groups: true }
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    console.error("GET /api/orders/[id] error", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const updated = await prisma.orders.update({ where: { id }, data: body });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/orders/[id] error", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.orders.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/orders/[id] error", err);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
