import { NextResponse } from "next/server";
import { PrismaClient, BillStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paymentId } = await req.json();

  // 1. Delete payment first & extract billId
  const payment = await prisma.payment.delete({
    where: { id: paymentId },
  });

  const billId = payment.billId;

  // 2. Fetch bill + remaining payments
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { payments: true },
  });

  if (!bill) {
    return NextResponse.json(
      { error: "Bill not found" },
      { status: 404 }
    );
  }

  // 3. Recalculate paid amount
  const totalPaid = bill.payments
    .filter((p) => p.id !== paymentId)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // 4. Determine new status
  const newStatus: BillStatus =
    totalPaid === 0
      ? BillStatus.PENDING
      : totalPaid >= Number(bill.total)
      ? BillStatus.PAID
      : BillStatus.PARTIALLY_PAID;

  // 5. Update bill status
  await prisma.bill.update({
    where: { id: billId },
    data: { status: newStatus },
  });

  return NextResponse.json({ removed: payment });
}
