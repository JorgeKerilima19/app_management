import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.inventory_items.findMany({ include: { inventory_adjustments: true, menu_items: true } });
    return NextResponse.json(items);
  } catch (err) {
    console.error("GET /api/inventory error", err);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, unit_type, current_stock = 0, low_stock_threshold = 0, category } = await req.json();
    if (!name || !unit_type) return NextResponse.json({ error: "name and unit_type required" }, { status: 400 });

    const created = await prisma.inventory_items.create({
      data: { name, unit_type, current_stock, low_stock_threshold, category }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/inventory error", err);
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
  }
}
