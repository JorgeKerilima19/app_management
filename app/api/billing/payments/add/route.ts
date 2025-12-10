import { NextResponse } from "next/server";
import { PrismaClient, BillStatus, PaymentMethod } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

// ADD PAYMENT
export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { billId, amount, method, reference } = await req.json();

  const payment = await prisma.payment.create({
    data: {
      billId,
      amount,
      method,
      reference: reference || null,
    },
  });

  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { payments: true },
  });

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  const newPayment = await prisma.payment.create({
    data: {
      billId,
      amount: Number(amount),
      method: method as PaymentMethod,
      reference: reference ?? null,
    },
  });

  // Recalcular pagos
  const totalPaid =
    bill.payments.reduce((sum, p) => sum + Number(p.amount), 0) +
    Number(amount);

  // Actualizar estado
  const newStatus: BillStatus =
    totalPaid >= Number(bill.total)
      ? BillStatus.PAID
      : BillStatus.PARTIALLY_PAID;

  await prisma.bill.update({
    where: { id: billId },
    data: { status: newStatus },
  });

  return NextResponse.json(payment);
}
