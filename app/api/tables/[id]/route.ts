// app/api/tables/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tableId = Number(id);
  if (isNaN(tableId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const table = await prisma.restaurantTable.findUnique({
      where: { id: tableId },
      include: { group: true, orders: true },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    return NextResponse.json(table);
  } catch (err: any) {
    console.error("API Table Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
