// app/(dashboard)/settings/void-records/page.tsx
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";

async function getVoidDetails(record: any) {
  try {
    if (record.target === "ORDER_ITEM") {
      const item = await prisma.orderItem.findUnique({
        where: { id: record.targetId },
        include: {
          menuItem: true,
          order: {
            include: {
              check: {
                include: { tables: true },
              },
            },
          },
        },
      });
      if (!item) return "Item not found";
      const tableNumbers = item.order.check.tables
        .map((t) => t.number)
        .join(", ");
      return `${item.menuItem.name} (x${item.quantity}) — Table ${tableNumbers}`;
    }

    if (record.target === "ORDER") {
      const order = await prisma.order.findUnique({
        where: { id: record.targetId },
        include: {
          check: {
            include: { tables: true },
          },
        },
      });
      if (!order) return "Order not found";
      const tableNumbers = order.check.tables.map((t) => t.number).join(", ");
      return `Order — Table ${tableNumbers}`;
    }

    if (record.target === "CHECK") {
      const check = await prisma.check.findUnique({
        where: { id: record.targetId },
        include: {
          tables: true,
        },
      });
      if (!check) return "Check not found";
      const tableNumbers = check.tables.map((t) => t.number).join(", ");
      return `Check — Tables ${tableNumbers} (Total: $${Number(
        check.total
      ).toFixed(2)})`;
    }

    return "Unknown";
  } catch (error) {
    console.error("Error fetching void details:", error);
    return "Error loading details";
  }
}

export default async function VoidRecordsPage() {
  const voidRecords = await prisma.voidRecord.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      voidedBy: { select: { name: true } },
    },
  });

  // ✅ Fetch details for each record
  const recordsWithDetails = await Promise.all(
    voidRecords.map(async (record) => {
      const details = await getVoidDetails(record);
      return { ...record, details };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-600">
          Record de Cancelaciones
        </h1>
        <Link
          href="/settings"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a Ajustes
        </Link>
      </div>

      {recordsWithDetails.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">Sin record de cancelaciones</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recordsWithDetails.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(record.createdAt, "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.voidedBy?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.target === "CHECK"
                            ? "bg-red-100 text-red-800"
                            : record.target === "ORDER"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {record.target === "CHECK"
                          ? "Order Void"
                          : record.target === "ORDER"
                          ? "Order Canceled"
                          : "Item Void"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      {record.details}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      {record.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
