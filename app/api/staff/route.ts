import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.staff.findMany({ include: { roles: true } });
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/staff error", err);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, role, role_id } = await req.json();
    if (!name || !role) return NextResponse.json({ error: "name and role required" }, { status: 400 });

    const created = await prisma.staff.create({ data: { name, role, role_id } });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/staff error", err);
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
  }
}
