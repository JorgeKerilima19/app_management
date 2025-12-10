import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: any) {
  try {
    const orderId = Number(params.id);
    const { items } = await req.json();

    await prisma.orderItemSpot.deleteMany({
      where: { orderItem: { orderId } },
    });

    await prisma.orderItem.deleteMany({
      where: { orderId },
    });

    const createdItems = await Promise.all(
      items.map((i: any) =>
        prisma.orderItem.create({
          data: {
            orderId,
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            notes: i.notes || null,
            spots: {
              create:
                i.seatNumbers?.map((s: number) => ({ seatNumber: s })) || [],
            },
          },
          include: { menuItem: true, spots: true },
        })
      )
    );

    return NextResponse.json(createdItems);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
