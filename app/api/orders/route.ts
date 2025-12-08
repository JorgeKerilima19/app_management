import { NextResponse } from "next/server";
import  prisma  from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        table: true,
        tableGroup: true,
        orderItems: {
          include: { menuItem: true, spots: true }
        },
        bills: true
      }
    });

    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tableId, tableGroupId } = body;

    if (!tableId && !tableGroupId)
      return NextResponse.json(
        { error: "Must provide tableId or tableGroupId" },
        { status: 400 }
      );

    const order = await prisma.order.create({
      data: {
        tableId: tableId || null,
        tableGroupId: tableGroupId || null,
      }
    });

    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
