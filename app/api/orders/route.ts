// app/api/orders/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
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

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tableId, tableGroupId, orderItems = [] } = body;

    if (!tableId && !tableGroupId) {
      return NextResponse.json(
        { error: "Must provide tableId or tableGroupId" },
        { status: 400 }
      );
    }

    // Validate orderItems format
    if (!Array.isArray(orderItems)) {
      return NextResponse.json(
        { error: "orderItems must be an array" },
        { status: 400 }
      );
    }

    for (const item of orderItems) {
      if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: "Each order item must have menuItemId and quantity > 0" },
          { status: 400 }
        );
      }
    }

    // Create order + items in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.create({
        data: {
          tableId: tableId || null,
          tableGroupId: tableGroupId || null,
          status: "OPEN",
        },
      });

      if (orderItems.length > 0) {
        await prisma.orderItem.createMany({
          data: orderItems.map((item) => ({
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            status: "PENDING",
          })),
        });
      }
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          orderItems: {
            include: { menuItem: true, spots: true },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Order creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
