// app/api/tables/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, TableStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: any) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const table = await prisma.restaurantTable.findUnique({
      where: { id: Number(params.id) },
      include: { group: true, orders: true },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    return NextResponse.json(table);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(req: Request, { params }: any) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  try {
    const updated = await prisma.restaurantTable.update({
      where: { id: Number(params.id) },
      data: {
        name: body.name,
        capacity: body.capacity ? Number(body.capacity) : undefined,
        status: body.status as TableStatus,
        groupId: body.groupId ?? undefined,
      },
      include: { group: true },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: any) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.restaurantTable.delete({
      where: { id: Number(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
