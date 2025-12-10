import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET BILL BY ID
export async function GET(req: Request, { params }: { params: any }) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bill = await prisma.bill.findUnique({
    where: { id: Number(params.id) },
    include: {
      splits: true,
      payments: true,
      order: true,
    },
  });

  return NextResponse.json(bill);
}

// UPDATE BILL (rarely used)
export async function PUT(req: Request, { params }: { params: any }) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const updated = await prisma.bill.update({
    where: { id: Number(params.id) },
    data: body,
  });

  return NextResponse.json(updated);
}
