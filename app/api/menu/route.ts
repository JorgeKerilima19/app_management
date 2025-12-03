import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.menu_items.findMany({ include: { inventory_items: true, stations: true } });
    return NextResponse.json(items);
  } catch (err) {
    console.error("GET /api/menu error", err);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, category, is_beverage = false, inventory_item_id = null, station_id = null } = body;

    if (!name || price == null || !category) {
      return NextResponse.json({ error: "name, price and category required" }, { status: 400 });
    }

    const created = await prisma.menu_items.create({
      data: {
        name,
        price,
        category,
        is_beverage,
        inventory_item_id,
        station_id
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/menu error", err);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}
