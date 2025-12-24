// app/(dashboard)/kitchen/page.tsx
import prisma from "@/lib/prisma";
import { markOrderAsReady } from "./actions";
import { format } from "date-fns";
import LogoutButton from "@/components/LogoutButton";

async function getTableNumbersForChecks(checks: any[]) {
  const tableIdMap = new Map<string, string>();
  const tableIds = new Set<string>();

  for (const check of checks) {
    try {
      const ids = JSON.parse(check.tableIds);
      if (Array.isArray(ids) && ids.length > 0) {
        tableIds.add(ids[0]);
        tableIdMap.set(check.id, ids[0]);
      }
    } catch (e) {
      console.error("Invalid tableIds:", check.tableIds);
    }
  }

  if (tableIds.size === 0) return new Map();

  const tables = await prisma.table.findMany({
    where: { id: { in: Array.from(tableIds) } },
    select: { id: true, number: true },
  });

  const tableNumberMap = new Map<string, number>();
  for (const table of tables) {
    tableNumberMap.set(table.id, table.number);
  }

  const result = new Map<string, number>();
  for (const [checkId, tableId] of tableIdMap.entries()) {
    const num = tableNumberMap.get(tableId);
    if (num) result.set(checkId, num);
  }

  return result;
}

function getOrderColor(sentAt: Date) {
  const now = new Date();
  const minutes = Math.floor((now.getTime() - sentAt.getTime()) / 60000);

  if (minutes < 5) {
    return {
      bg: "bg-green-100",
      border: "border-green-500",
      text: "text-green-800",
      pulse: "",
    };
  } else if (minutes <= 10) {
    return {
      bg: "bg-yellow-100",
      border: "border-yellow-500",
      text: "text-yellow-800",
      pulse: "",
    };
  } else {
    return {
      bg: "bg-red-100",
      border: "border-red-500",
      text: "text-red-800",
      pulse: "animate-pulse",
    };
  }
}

// ✅ Group items by category (for display)
function groupItemsByCategory(items: any[]) {
  const categories = Array.from(
    new Set(items.map((item) => item.menuItem.category?.name || "Other"))
  ).sort();

  return categories.map((cat) => ({
    name: cat,
    items: items.filter(
      (item) => (item.menuItem.category?.name || "Other") === cat
    ),
  }));
}

export default async function KitchenPage() {
  const [activeOrders, completedOrders] = await Promise.all([
    prisma.order.findMany({
      where: { status: "SENT" },
      include: {
        check: true,
        items: {
          include: {
            menuItem: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { sentToKitchenAt: "asc" },
    }),
    prisma.order.findMany({
      where: { status: { in: ["READY", "COMPLETED"] } },
      include: {
        check: true,
        items: {
          include: {
            menuItem: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const allChecks = [...activeOrders, ...completedOrders].map((o) => o.check);
  const tableNumberMap = await getTableNumbersForChecks(allChecks);

  return (
    <>
      <meta httpEquiv="refresh" content="10" />

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <LogoutButton></LogoutButton>
        <h1 className="text-3xl font-bold text-amber-800 mb-8 text-center">
          Ordenes activas
        </h1>

        {/* ACTIVE ORDERS */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
            <span className="w-4 h-4 bg-red-500 rounded-full mr-3 animate-pulse"></span>
            A preparar
          </h2>

          {activeOrders.length === 0 ? (
            <p className="text-gray-600 text-lg text-center py-8 bg-gray-50 rounded-xl">
              Sin ordenes activas
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {activeOrders.map((order) => {
                const tableNumber = tableNumberMap.get(order.check.id) ?? "?";
                const { bg, border, text, pulse } = getOrderColor(
                  order.sentToKitchenAt!
                );
                const groupedItems = groupItemsByCategory(order.items);

                return (
                  <form
                    key={order.id}
                    action={markOrderAsReady}
                    className={`${bg} ${border} border-2 rounded-xl p-5 shadow-md hover:shadow-lg transition-all ${pulse} cursor-pointer`}
                  >
                    <input type="hidden" name="orderId" value={order.id} />

                    {/* Table & Time */}
                    <div className="text-center mb-4">
                      <div className={`text-4xl font-bold ${text}`}>
                        Mesa {tableNumber}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {format(order.sentToKitchenAt!, "HH:mm")}
                      </div>
                    </div>

                    {/* Items grouped by category */}
                    <div className="space-y-3 mb-4">
                      {groupedItems.map((group) => (
                        <div key={group.name}>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                            {group.name}
                          </div>
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between font-medium text-gray-800"
                            >
                              <span>{item.menuItem.name}</span>
                              <span>×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    {order.items.some((item) => item.notes) && (
                      <div className="text-xs bg-white/80 p-2 rounded text-center italic text-gray-700">
                        {order.items
                          .filter((item) => item.notes)
                          .map((item) => `"${item.notes}"`)
                          .join(", ")}
                      </div>
                    )}

                    {/* ✅ Entire card is clickable — hidden submit fills the card */}
                    <button
                      type="submit"
                      className="absolute inset-0 w-full h-full opacity-0"
                      aria-label={`Mark order for Table ${tableNumber} as ready`}
                    ></button>
                  </form>
                );
              })}
            </div>
          )}
        </section>

        {/* COMPLETED ORDERS — also grouped by category */}
        {completedOrders.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
              Entregadas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {completedOrders.map((order) => {
                const tableNumber = tableNumberMap.get(order.check.id) ?? "?";
                const readyTime = format(order.updatedAt, "HH:mm");
                const groupedItems = groupItemsByCategory(order.items);

                return (
                  <div
                    className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5"
                    key={order.id}
                  >
                    <div className="text-center mb-3">
                      <div className="text-4xl font-bold text-blue-800">
                        Mesa {tableNumber}
                      </div>
                      <div className="text-sm text-blue-600 font-medium mt-1">
                        Entregada {readyTime}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {groupedItems.map((group) => (
                        <div key={group.name}>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                            {group.name}
                          </div>
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-gray-700"
                            >
                              <span>{item.menuItem.name}</span>
                              <span>×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
