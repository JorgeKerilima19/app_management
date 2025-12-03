import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.orders.findMany({
      include: { order_items: true, payments: true, table_groups: true }
    });
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/orders error", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { table_group_id, table_id } = body;

    const orderData: any = { status: "open", total_amount: 0 };

    if (table_group_id) orderData.table_group_id = table_group_id;

    const order = await prisma.orders.create({ data: orderData });

    if (table_id) {
      await prisma.tables.update({
        where: { id: table_id },
        data: { current_order_id: order.id, status: "occupied" }
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders error", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
