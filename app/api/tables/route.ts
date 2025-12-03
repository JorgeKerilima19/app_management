import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.tables.findMany({
      include: { table_groups: true, orders: true },
    });
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/tables error", err);
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { table_number, capacity } = body;

    if (!table_number || !capacity) {
      return NextResponse.json(
        { error: "table_number and capacity required" },
        { status: 400 }
      );
    }

    const table = await prisma.tables.create({
      data: { table_number, capacity, status: "free" },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (err) {
    console.error("POST /api/tables error", err);
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 500 }
    );
  }
}
