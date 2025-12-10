import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bills = await prisma.bill.findMany({
    where: { status: "PAID" },
    include: { payments: true },
  });

  const totalSales = bills.reduce((sum, b) => sum + Number(b.total), 0);

  const summary = await prisma.dailySummary.upsert({
    where: { date: today },
    update: { totalSales },
    create: {
      date: today,
      totalSales,
    },
  });

  return NextResponse.json(summary);
}
