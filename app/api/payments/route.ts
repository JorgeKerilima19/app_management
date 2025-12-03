import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.payments.findMany({ include: { staff: true, orders: true } });
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/payments error", err);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
