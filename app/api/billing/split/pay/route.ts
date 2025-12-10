import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

// PAY SPLIT
export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { splitId } = await req.json();

  const updated = await prisma.billSplit.update({
    where: { id: splitId },
    data: { isPaid: true },
  });

  return NextResponse.json(updated);
}
