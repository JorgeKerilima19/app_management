// app/api/orders/[id]/items/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  try {
    const orderId = Number(params.id);
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];

    const created = [];
    for (const it of items) {
      const menu = await prisma.menu_items.findUnique({
        where: { id: it.menuItemId },
      });
      if (!menu) throw new Error(`Menu item ${it.menuItemId} not found`);

      const ci = await prisma.order_items.create({
        data: {
          order_id: orderId,
          menu_item_id: it.menuItemId,
          quantity: it.quantity ?? 1,
          unit_price: menu.price,
          special_instructions: it.special_instructions ?? null,
          share_id: it.share_id ?? null,
          status: "queued",
        },
      });
      created.push(ci);
    }

    const sumAgg = await prisma.order_items.aggregate({
      where: { order_id: orderId },
      _sum: { unit_price: true },
    });

    const allItems = await prisma.order_items.findMany({
      where: { order_id: orderId },
    });
    const total = allItems.reduce(
      (acc: any, r: any) => acc + Number(r.unit_price) * r.quantity,
      0
    );

    await prisma.orders.update({
      where: { id: orderId },
      data: { total_amount: total },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/orders/[id]/items error", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to add items" },
      { status: 500 }
    );
  }
}
