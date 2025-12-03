import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { orderId: string } };

export async function POST(req: Request, { params }: Params) {
  try {
    const orderId = Number(params.orderId);
    const { amount, method, share_id, yape_transaction_id, yape_sender_phone, processed_by } = await req.json();

    if (!amount || !method || !processed_by) {
      return NextResponse.json({ error: "amount, method and processed_by are required" }, { status: 400 });
    }

    const payment = await prisma.payments.create({
      data: {
        order_id: orderId,
        amount,
        method,
        share_id: share_id ?? null,
        yape_transaction_id: yape_transaction_id ?? null,
        yape_sender_phone: yape_sender_phone ?? null,
        processed_by
      }
    });

    // After payment, check aggregated paid amount
    const sum = await prisma.payments.aggregate({
      where: { order_id: orderId },
      _sum: { amount: true }
    });

    const paidSoFar = Number(sum._sum.amount ?? 0);

    const order = await prisma.orders.findUnique({ where: { id: orderId } });

    if (order && paidSoFar >= Number(order.total_amount)) {
      await prisma.orders.update({ where: { id: orderId }, data: { status: "paid", paid_at: new Date() } });

      // If tables have current_order_id equal to this order, mark tables as paid/free (optional)
      const tbls = await prisma.tables.findMany({ where: { current_order_id: orderId } });
      if (tbls.length) {
        await prisma.tables.updateMany({
          where: { current_order_id: orderId },
          data: { status: "paid", current_order_id: null }
        });
      }
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    console.error("POST /api/payments/[orderId] error", err);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
