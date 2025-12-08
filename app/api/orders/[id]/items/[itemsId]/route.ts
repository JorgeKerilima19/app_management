import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: any) {
  try {
    const { itemId } = params;
    const body = await req.json();

    const updated = await prisma.orderItem.update({
      where: { id: Number(itemId) },
      data: body,
      include: { menuItem: true, spots: true },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: any, { params }: any) {
  try {
    const { itemId } = params;

    await prisma.orderItemSpot.deleteMany({
      where: { orderItemId: Number(itemId) },
    });
    await prisma.orderItem.delete({ where: { id: Number(itemId) } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
