// app/api/table-groups/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/table-groups
export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await prisma.tableGroup.findMany({
    orderBy: { id: "asc" }
  });

  return NextResponse.json(groups);
}

// POST /api/table-groups
export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { tables } = await req.json();

    const group = await prisma.tableGroup.create({
      data: {
        tables: tables ?? []
      }
    });

    return NextResponse.json(group, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
