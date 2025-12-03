import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { inventory_item_id, amount, reason, notes, adjusted_by } = await req.json();
    if (!inventory_item_id || amount == null || !reason || !adjusted_by) {
      return NextResponse.json({ error: "inventory_item_id, amount, reason, adjusted_by required" }, { status: 400 });
    }

    const adj = await prisma.inventory_adjustments.create({
      data: { inventory_item_id, amount, reason, notes: notes ?? null, adjusted_by }
    });

    // apply immediately to current_stock
    await prisma.inventory_items.update({
      where: { id: inventory_item_id },
      data: { current_stock: { increment: Number(amount) } as any } // workaround; Prisma decimal update
    });

    return NextResponse.json(adj, { status: 201 });
  } catch (err) {
    console.error("POST /api/inventory/adjustments error", err);
    return NextResponse.json({ error: "Failed to create adjustment" }, { status: 500 });
  }
}
