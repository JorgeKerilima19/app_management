import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bills = await prisma.bill.findMany({
    include: {
      splits: true,
      payments: true,
      order: true,
    },
  });

  return NextResponse.json(bills);
}

// CREATE BILL
export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { orderId, total } = body;

  const bill = await prisma.bill.create({
    data: {
      orderId,
      total,
    },
  });

  return NextResponse.json(bill);
}
