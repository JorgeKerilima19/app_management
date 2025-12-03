import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const shifts = await prisma.shift.findMany({
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json(shifts);
}

export async function POST(req: Request) {
  const { staffId, startTime, endTime } = await req.json();

  if (!staffId || !startTime)
    return NextResponse.json({ error: "Missing staffId or startTime" }, { status: 400 });

  const shift = await prisma.shift.create({
    data: {
      staffId,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
    },
  });

  return NextResponse.json(shift);
}
