import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const m = await prisma.menu_items.findUnique({ where: { id }, include: { stations: true } });
    if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(m);
  } catch (err) {
    console.error("GET /api/menu/[id] error", err);
    return NextResponse.json({ error: "Failed to fetch menu item" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const updated = await prisma.menu_items.update({ where: { id }, data: body });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/menu/[id] error", err);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.menu_items.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/menu/[id] error", err);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
