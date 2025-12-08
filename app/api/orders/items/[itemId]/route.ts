import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OrderItemStatus } from "@prisma/client";

export async function PUT(req: Request, { params }: any) {
  try {
    const body = await req.json();

    if (body.status && !Object.values(OrderItemStatus).includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid order item status" },
        { status: 400 }
      );
    }

    const updated = await prisma.orderItem.update({
      where: { id: Number(params.itemId) },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: any) {
  try {
    await prisma.orderItem.delete({
      where: { id: Number(params.itemId) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
