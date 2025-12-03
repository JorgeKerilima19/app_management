import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export async function POST(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.orders.update({
      where: { id },
      data: { status: "closed", closed_at: new Date() }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/orders/[id]/close error", err);
    return NextResponse.json({ error: "Failed to close order" }, { status: 500 });
  }
}
