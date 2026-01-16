// app/(auth)/cashier/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { CashierClientWrapper } from "./CashierClientWrapper";

function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return parseFloat(value.toString());
}

export default async function CashierPage() {
  const user = await getCurrentUser();
  if (!user || !["CAJERO", "OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  // Fetch ALL tables on the server
  const tables = await prisma.table.findMany({
    // No where clause to get all tables
    include: {
      currentCheck: {
        include: {
          orders: {
            include: {
              items: {
                include: {
                  menuItem: {
                    include: { category: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { number: "asc" },
  });

  const serializedTables = tables.map((table) => {
    if (!table.currentCheck) {
      return { ...table, currentCheck: null };
    }

    return {
      ...table,
      currentCheck: {
        ...table.currentCheck,
        subtotal: toNumber(table.currentCheck.subtotal),
        tax: toNumber(table.currentCheck.tax),
        discount: toNumber(table.currentCheck.discount),
        total: toNumber(table.currentCheck.total),
        orders: table.currentCheck.orders.map((order) => ({
          ...order,
          items: order.items.map((item) => ({
            ...item,
            priceAtOrder: toNumber(item.priceAtOrder),
            menuItem: {
              ...item.menuItem,
              price: toNumber(item.menuItem.price),
            },
          })),
        })),
      },
    };
  });

  // Pass all serialized tables to the client wrapper
  return <CashierClientWrapper tables={serializedTables} />;
}
