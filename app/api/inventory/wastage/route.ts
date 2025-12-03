import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all wastage logs
export async function GET() {
  try {
    const logs = await prisma.inventory_adjustments.findMany({
      where: {
        reason: "wastage",
      },
      include: {
        inventory_items: true,
        staff: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(logs);
  } catch (err) {
    console.error("GET /api/inventory/wastage error", err);
    return NextResponse.json({ error: "Failed to fetch wastage logs" }, { status: 500 });
  }
}

// POST create wastage log
export async function POST(req: Request) {
  try {
    const { inventory_item_id, amount, notes } = await req.json();

    if (!inventory_item_id || !amount) {
      return NextResponse.json(
        { error: "inventory_item_id and amount are required" },
        { status: 400 }
      );
    }

    // Create adjustment record
    const log = await prisma.inventory_adjustments.create({
      data: {
        inventory_item_id,
        amount: String(amount), // Prisma Decimal
        reason: "wastage",
        notes,
        adjusted_by: 1, // CHANGE IF YOU PASS STAFF ID
      },
    });

    // Reduce inventory stock
    await prisma.inventory_items.update({
      where: { id: inventory_item_id },
      data: {
        current_stock: {
          decrement: amount,
        },
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error("POST /api/inventory/wastage error", err);
    return NextResponse.json({ error: "Failed to create wastage log" }, { status: 500 });
  }
}
