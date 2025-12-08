// app/api/tables/merge/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tableIds } = await req.json();

  if (!Array.isArray(tableIds) || tableIds.length < 2) {
    return NextResponse.json(
      { error: "Must provide at least two tables to merge" },
      { status: 400 }
    );
  }

  try {
    // Crear grupo
    const group = await prisma.tableGroup.create({ data: {} });

    // Asignar tables al grupo
    await prisma.restaurantTable.updateMany({
      where: { id: { in: tableIds } },
      data: { groupId: group.id },
    });

    const result = await prisma.tableGroup.findUnique({
      where: { id: group.id },
      include: { tables: true },
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
