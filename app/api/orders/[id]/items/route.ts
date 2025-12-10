// app/api/orders/[id]/items/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// POST: add item to order
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orderId = Number(id);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const { menuItemId, quantity, notes, spotNumbers } = await req.json();

  if (!menuItemId || !quantity) {
    return NextResponse.json(
      { error: "menuItemId and quantity required" },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || (order.status !== "OPEN" && order.status !== "CLOSED")) {
      return NextResponse.json(
        { error: "Invalid order state" },
        { status: 400 }
      );
    }

    // ✅ Allow adding items even if CLOSED (follow-up items)
    const item = await prisma.orderItem.create({
      data: {
        orderId,
        menuItemId,
        quantity,
        notes: notes || null,
        status: "PENDING",
        spots: {
          create: (spotNumbers || []).map((spot: number) => ({
            seatNumber: spot,
          })),
        },
      },
      include: { menuItem: true, spots: true },
    });

    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: remove item (only if order is OPEN)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(req.url);
  const itemId = url.searchParams.get("itemId");
  if (!itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }

  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orderId = Number(id);
  const orderItemId = Number(itemId);

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== "OPEN") {
      return NextResponse.json(
        { error: "Can only remove items from OPEN orders" },
        { status: 400 }
      );
    }

    await prisma.orderItem.delete({ where: { id: orderItemId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
