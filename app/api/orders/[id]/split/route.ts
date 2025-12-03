import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  try {
    const orderId = Number(params.id);
    const { shares } = await req.json();
    // shares example: [{ shareId: 1, itemIds: [10,12] }, { shareId: 2, itemIds: [13] }]

    if (!Array.isArray(shares)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    for (const s of shares) {
      if (!s.shareId || !Array.isArray(s.itemIds)) continue;
      await prisma.order_items.updateMany({
        where: { id: { in: s.itemIds }, order_id: orderId },
        data: { share_id: s.shareId }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/orders/[id]/split error", err);
    return NextResponse.json({ error: "Failed to split items" }, { status: 500 });
  }
}
