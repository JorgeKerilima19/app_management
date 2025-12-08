import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_: any, { params }: any) {
  try {
    const tableId = Number(params.id);

    const orders = await prisma.order.findMany({
      where: { tableId },
      orderBy: { createdAt: "desc" },
      include: {
        table: true,
        tableGroup: true,
        orderItems: {
          include: { menuItem: true, spots: true },
        },
        bills: true,
      },
    });

    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
