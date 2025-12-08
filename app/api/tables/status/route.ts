// app/api/tables/status/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, TableStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tableId, status } = await req.json();

  try {
    const updated = await prisma.restaurantTable.update({
      where: { id: Number(tableId) },
      data: { status: status as TableStatus },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
