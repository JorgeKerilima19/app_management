import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const table = await prisma.tables.findUnique({
      where: { id },
      include: { table_groups: true, orders: true }
    });
    if (!table) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(table);
  } catch (err) {
    console.error("GET /api/tables/[id] error", err);
    return NextResponse.json({ error: "Failed to fetch table" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const updated = await prisma.tables.update({
      where: { id },
      data: body
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/tables/[id] error", err);
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.tables.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/tables/[id] error", err);
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 });
  }
}
