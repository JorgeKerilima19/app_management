import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: any) {
  try {
    const tableId = Number(params.id);

    const order = await prisma.order.create({
      data: {
        tableId,
        status: "OPEN",
      },
    });

    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
