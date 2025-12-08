// app/api/tables/unmerged/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tables = await prisma.restaurantTable.findMany({
      where: { groupId: null },
      include: { group: true },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(tables);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
