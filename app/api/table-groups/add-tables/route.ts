// app/api/table-groups/add-tables/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

// POST /api/table-groups/add-tables
export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId, tableIds } = await req.json();

  try {
    const group = await prisma.tableGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const updated = await prisma.tableGroup.update({
      where: { id: groupId },
      data: {
        tables: {
          connect: tableIds.map((id: number) => ({ id })),
        },
      },
      include: {
        tables: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
