// app/(dashboard)/kitchen/page.tsx
import prisma from "@/lib/prisma";
import { markOrderAsReady } from './actions';
import { format } from 'date-fns';

// Helper: Parse table IDs and map to table number
async function getTableNumberFromCheck(check: any): Promise<number | null> {
  try {
    const tableIds = JSON.parse(check.tableIds);
    if (!Array.isArray(tableIds) || tableIds.length === 0) return null;

    // Fetch the table by ID to get its number
    const table = await prisma.table.findUnique({
      where: { id: tableIds[0] },
    });
    return table?.number || null;
  } catch (error) {
    console.error("Error parsing tableIds:", check.tableIds);
    return null;
  }
}

// Helper: Get background color class
function getBgClass(sentAt: Date) {
  const minutes = Math.floor((Date.now() - sentAt.getTime()) / 60000);
  if (minutes < 5) return "bg-green-50"; // Light green
  if (minutes <= 10) return "bg-yellow-50"; // Light yellow
  return "bg-red-50 animate-pulse-danger"; // Light red + pulse
}

// Helper: Get border color class
function getBorderClass(sentAt: Date) {
  const minutes = Math.floor((Date.now() - sentAt.getTime()) / 60000);
  if (minutes < 5) return "border-green-200";
  if (minutes <= 10) return "border-yellow-200";
  return "border-red-300";
}

export default async function KitchenPage() {
  const [activeOrders, completedOrders] = await Promise.all([
    prisma.order.findMany({
      where: { status: "SENT" },
      include: { check: true, items: { include: { menuItem: true } } },
      orderBy: { sentToKitchenAt: "asc" },
    }),
    prisma.order.findMany({
      where: { status: { in: ["READY", "COMPLETED"] } },
      include: { check: true, items: { include: { menuItem: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-amber-700 mb-8 text-center">
        KITCHEN ORDERS
      </h1>

      {/* ACTIVE ORDERS */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
          <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
          NOW COOKING
        </h2>

        {activeOrders.length === 0 ? (
          <p className="text-gray-500 text-lg text-center py-8">
            No active orders
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {activeOrders.map(async (order) => {
              const tableNumber = await getTableNumberFromCheck(order.check);
              const bgClass = getBgClass(order.sentToKitchenAt!);
              const borderClass = getBorderClass(order.sentToKitchenAt!);

              return (
                <form
                  key={order.id}
                  action={markOrderAsReady}
                  className={`${bgClass} ${borderClass} border-2 rounded-xl p-5 shadow-md hover:shadow-lg transition cursor-pointer`}
                >
                  <input type="hidden" name="orderId" value={order.id} />

                  <div className="text-center mb-4">
                    <div className="text-3xl font-extrabold text-gray-800">
                      Table {tableNumber ?? "?"}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="font-medium">
                          {item.menuItem.name}
                        </span>
                        <span className="font-medium">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {order.items.some((item) => item.notes) && (
                    <div className="text-xs italic text-gray-600 mb-4">
                      {order.items
                        .filter((item) => item.notes)
                        .map((item) => `"${item.notes}"`)
                        .join(", ")}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition text-sm"
                  >
                    MARK READY
                  </button>
                </form>
              );
            })}
          </div>
        )}
      </section>

      {/* COMPLETED ORDERS — WITH READY TIME */}
      {completedOrders.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
            <span className="w-4 h-4 bg-gray-400 rounded-full mr-3"></span>
            READY TO SERVE
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {completedOrders.map(async (order) => {
              const tableNumber = await getTableNumberFromCheck(order.check);
              // ✅ Use updatedAt as "ready time"
              const readyTime = format(order.updatedAt, "HH:mm");

              return (
                <div className="bg-gray-100 border-2 border-gray-200 rounded-xl p-5 opacity-90">
                  {/* Table + Ready Time */}
                  <div className="text-center mb-3">
                    <div className="text-3xl font-extrabold text-gray-700">
                      Table {tableNumber ?? "?"}
                    </div>
                    <div className="text-sm text-amber-700 font-medium mt-1">
                      Ready at {readyTime}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span>{item.menuItem.name}</span>
                        <span>x{item.quantity}</span>
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
  );
}
