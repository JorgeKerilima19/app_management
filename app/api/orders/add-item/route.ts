import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { orderId, menuItemId, quantity, notes, seats } = await req.json();

    const item = await prisma.orderItem.create({
      data: {
        orderId,
        menuItemId,
        quantity,
        notes: notes || null,
        spots: seats?.map((seat: number) => ({
          seatNumber: seat
        })) || []
      },
      include: { menuItem: true, spots: true }
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
