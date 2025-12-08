import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { billId, splits } = await req.json();
  // splits = [{ seatNumber, amount }]

  const result = await prisma.billSplit.createMany({
    data: splits.map((s: any) => ({
      billId,
      seatNumber: s.seatNumber,
      amount: s.amount,
    })),
  });

  return NextResponse.json(result);
}
