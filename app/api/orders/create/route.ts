import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { tableId, tableGroupId } = await req.json();

    if (!tableId && !tableGroupId) {
      return NextResponse.json(
        { error: "Provide tableId or tableGroupId" },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: { tableId: tableId || null, tableGroupId: tableGroupId || null },
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
