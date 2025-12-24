// app/(dashboard)/dashboard/page.tsx
import prisma from "@/lib/prisma";
import { format } from "date-fns";

function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return parseFloat(value.toString());
}

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all closed checks today
  const checks = await prisma.check.findMany({
    where: {
      closedAt: { gte: today },
      status: "CLOSED",
    },
    include: {
      payments: true,
      orders: {
        include: {
          items: {
            include: { menuItem: true },
          },
        },
      },
    },
    orderBy: { closedAt: "desc" },
  });

  // Get all unique table IDs from all checks
  const allTableIds = new Set<string>();
  checks.forEach((check) => {
    try {
      const ids = JSON.parse(check.tableIds);
      if (Array.isArray(ids)) {
        ids.forEach((id) => allTableIds.add(id));
      }
    } catch (e) {
      console.error("Invalid tableIds:", check.tableIds);
    }
  });

  // Fetch all tables at once
  const tables = await prisma.table.findMany({
    where: { id: { in: Array.from(allTableIds) } },
  });

  // Create a map: id → number
  const tableNumberMap = new Map<string, number>();
  tables.forEach((table) => {
    tableNumberMap.set(table.id, table.number);
  });

  // Enrich checks with table numbers
  const salesLog = checks.map((check) => {
    let tableNumbers: number[] = [];
    try {
      const ids = JSON.parse(check.tableIds);
      if (Array.isArray(ids)) {
        tableNumbers = ids
          .map((id) => tableNumberMap.get(id))
          .filter((num): num is number => num !== undefined)
          .sort();
      }
    } catch (e) {
      // Already logged above
    }
    return { ...check, tableNumbers };
  });

  // === PAYMENT TOTALS ===
  const payments = salesLog.flatMap((check) => check.payments);

  const cashTotal = payments.reduce((sum, p) => {
    if (p.method === "CASH") return sum + toNumber(p.amount);
    if (p.method === "MIXED") return sum + toNumber(p.cashAmount || 0);
    return sum;
  }, 0);

  const yapeTotal = payments.reduce((sum, p) => {
    if (p.method === "MOBILE_PAY") return sum + toNumber(p.amount);
    if (p.method === "MIXED") return sum + toNumber(p.mobilePayAmount || 0);
    return sum;
  }, 0);

  // === TOP ITEMS ===
  const itemQuantities = new Map<string, { name: string; quantity: number }>();
  salesLog.forEach((check) => {
    check.orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.menuItemId;
        if (itemQuantities.has(key)) {
          itemQuantities.get(key)!.quantity += item.quantity;
        } else {
          itemQuantities.set(key, {
            name: item.menuItem.name,
            quantity: item.quantity,
          });
        }
      });
    });
  });

  const topItems = Array.from(itemQuantities.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // === PAYMENT METHODS ===
  const paymentMethods = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalPayments = payments.length;
  const paymentPercentages = Object.fromEntries(
    Object.entries(paymentMethods).map(([method, count]) => [
      method,
      totalPayments ? ((count / totalPayments) * 100).toFixed(0) + "%" : "0%",
    ])
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Resumen del día</h1>
        <div className="text-right">
          <div className="text-lg font-bold text-emerald-600">
            Yape: S/{yapeTotal.toFixed(2)}
          </div>
          <div className="text-lg font-bold text-amber-600">
            Cash: S/{cashTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* MAIN METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Items */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Items más vendidos hoy</h2>
          <ul className="space-y-2">
            {topItems.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>{item.name}</span>
                <span className="font-medium">{item.quantity}x</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Métodos de pago</h2>
          <ul className="space-y-2">
            {Object.entries(paymentPercentages).map(([method, pct]) => (
              <li key={method} className="flex justify-between">
                <span>
                  {method === "MOBILE_PAY"
                    ? "Yape"
                    : method.charAt(0) + method.slice(1).toLowerCase()}
                </span>
                <span className="font-medium">{pct}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SALES LOG */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 pb-4">Resumen de Ventas</h2>
        {salesLog.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Sin ventas hoy</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">Mesa</th>
                  <th className="text-left p-4">Items</th>
                  <th className="text-right p-4">Monto</th>
                  <th className="text-left p-4">Método</th>
                  <th className="text-left p-4">Hora</th>
                </tr>
              </thead>
              <tbody>
                {salesLog.flatMap((check) =>
                  check.payments.map((payment) => {
                    let paymentDisplay = "";
                    if (payment.method === "MIXED") {
                      const cash = toNumber(payment.cashAmount);
                      const yape = toNumber(payment.mobilePayAmount);
                      paymentDisplay = `Cash: S/${cash.toFixed(
                        2
                      )}, Yape: S/${yape.toFixed(2)}`;
                    } else {
                      paymentDisplay =
                        payment.method === "MOBILE_PAY"
                          ? "Yape"
                          : payment.method;
                    }

                    return (
                      <tr
                        key={payment.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4">
                          {check.tableNumbers.length > 0
                            ? check.tableNumbers.join(", ")
                            : "—"}
                        </td>
                        <td className="p-4 text-sm max-w-xs">
                          {check.orders
                            .flatMap((o) => o.items)
                            .map((item) => (
                              <div key={item.id} className="truncate">
                                {item.menuItem.name} x{item.quantity}
                              </div>
                            ))}
                        </td>
                        <td className="p-4 text-right">
                          S/{toNumber(payment.amount).toFixed(2)}
                        </td>
                        <td className="p-4">{paymentDisplay}</td>
                        <td className="p-4">
                          {format(check.closedAt!, "HH:mm")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
