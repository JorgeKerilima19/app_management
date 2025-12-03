// app/api/receipts/[orderId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { orderId: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const orderId = Number(params.orderId);
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { order_items: { include: { menu_items: true } }, payments: true, table_groups: true }
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const itemsHtml = order.order_items.map((it:any) => {
      const name = (it as any).menu_items?.name ?? "Item";
      const price = Number(it.unit_price).toFixed(2);
      return `<tr>
        <td>${name}</td>
        <td>${it.quantity}</td>
        <td style="text-align:right">${(Number(it.unit_price) * it.quantity).toFixed(2)}</td>
      </tr>`;
    }).join("");

    const total = Number(order.total_amount).toFixed(2);
    const paymentsSum = order.payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0).toFixed(2);

    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Receipt ${order.id}</title>
<style>
body{font-family: Arial, sans-serif; font-size: 14px}
table{width:100%; border-collapse: collapse}
td,th{padding:6px; border-bottom:1px solid #eee}
.total { font-weight: bold; }
</style>
</head>
<body>
  <h2>Receipt #${order.id}</h2>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr><td colspan="2" class="total">Total</td><td style="text-align:right" class="total">${total}</td></tr>
      <tr><td colspan="2">Paid</td><td style="text-align:right">${paymentsSum}</td></tr>
    </tfoot>
  </table>
</body>
</html>`;

    return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html" } });
  } catch (err) {
    console.error("GET /api/receipts/[orderId] error", err);
    return NextResponse.json({ error: "Failed to render receipt" }, { status: 500 });
  }
}
