import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_: any, { params }: any) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(params.id) },
      include: {
        table: true,
        tableGroup: true,
        orderItems: { include: { menuItem: true, spots: true } },
        bills: true,
      },
    });

    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: any) {
  try {
    const body = await req.json();

    const updated = await prisma.order.update({
      where: { id: Number(params.id) },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: any, { params }: any) {
  try {
    const updated = await prisma.order.update({
      where: { id: Number(params.id) },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
