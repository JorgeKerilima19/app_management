// app/api/table-groups/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: any) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const group = await prisma.tableGroup.findUnique({
    where: { id: Number(params.id) }
  });

  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  return NextResponse.json(group);
}

// PATCH /api/table-groups/:id
export async function PATCH(req: Request, { params }: any) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const updated = await prisma.tableGroup.update({
      where: { id: Number(params.id) },
      data: body
    });

    return NextResponse.json(updated);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/table-groups/:id
export async function DELETE(req: Request, { params }: any) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.tableGroup.delete({
      where: { id: Number(params.id) }
    });

    return NextResponse.json({ message: "Group deleted" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
