import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: any) {
  try {
    const orderId = Number(params.id);
    const { menuItemId, quantity, notes, seatNumbers } = await req.json();

    const item = await prisma.orderItem.create({
      data: {
        orderId,
        menuItemId,
        quantity,
        notes,
        spots: {
          create:
            seatNumbers?.map((seat: number) => ({
              seatNumber: seat,
            })) || [],
        },
      },
      include: { menuItem: true, spots: true },
    });

    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
