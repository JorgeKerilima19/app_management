import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export async function POST(req: Request) {
  try {
    const { tableIds } = await req.json();
    if (!Array.isArray(tableIds) || tableIds.length < 2) {
      return NextResponse.json({ error: "Provide an array of at least 2 tableIds" }, { status: 400 });
    }

    const group = await prisma.table_groups.create({ data: {} });

    await prisma.tables.updateMany({
      where: { id: { in: tableIds } },
      data: { table_group_id: group.id, status: "occupied" }
    });

    const order = await prisma.orders.create({
      data: { table_group_id: group.id, status: "open", total_amount: 0 }
    });
    await prisma.tables.updateMany({
      where: { id: { in: tableIds } },
      data: { current_order_id: order.id }
    });

    return NextResponse.json({ group, order }, { status: 201 });
  } catch (err) {
    console.error("POST /api/tables/merge error", err);
    return NextResponse.json({ error: "Failed to merge tables" }, { status: 500 });
  }
}
