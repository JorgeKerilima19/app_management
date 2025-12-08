// app/api/menu/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, price, category, type } = await req.json();

  try {
    const item = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        category, // must be MenuCategory enum
        type, // must be MenuType enum
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
