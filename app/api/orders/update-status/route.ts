import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing orderId or status" },
        { status: 400 }
      );
    }

    if (!Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
