// app/api/tables/route.ts
import { NextResponse } from "next/server";
import { TableStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tables = await prisma.restaurantTable.findMany({
      include: { group: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(tables);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, capacity, status, groupId } = await req.json();

  try {
    const created = await prisma.restaurantTable.create({
      data: {
        name,
        capacity: Number(capacity),
        status: status as TableStatus,
        groupId: groupId || null,
      },
      include: { group: true },
    });
    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}