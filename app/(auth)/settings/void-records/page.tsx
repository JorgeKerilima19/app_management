// app/settings/void-records/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
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
      if (!item) return "Item no encontrado";
      const tableNumbers = item.order.check.tables
        .map((t: any) => t.number)
        .join(", ");
      return `${item.menuItem.name} (x${item.quantity}) — Mesa ${tableNumbers}`;
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
      if (!order) return "Orden no encontrada";
      const tableNumbers = order.check.tables
        .map((t: any) => t.number)
        .join(", ");
      return `Orden — Mesa ${tableNumbers}`;
    }

    if (record.target === "CHECK") {
      const check = await prisma.check.findUnique({
        where: { id: record.targetId },
        include: {
          tables: true,
        },
      });
      if (!check) return "Cuenta no encontrada";
      const tableNumbers = check.tables.map((t: any) => t.number).join(", ");
      return `Cuenta — Mesas ${tableNumbers} (Total: S/${Number(
        check.total
      ).toFixed(2)})`;
    }

    return "Desconocido";
  } catch (error) {
    console.error("Error fetching void details:", error);
    return "Error cargando detalles";
  }
}

export default async function VoidRecordsPage({
  searchParams,
}: {
  searchParams?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    target?: string;
    reason?: string;
    page?: string;
  };
}) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    redirect("/login");
  }

  // Parse search params
  const startDate = searchParams?.startDate
    ? new Date(searchParams.startDate)
    : null;
  const endDate = searchParams?.endDate ? new Date(searchParams.endDate) : null;
  const userId = searchParams?.userId || "";
  const target = searchParams?.target || "";
  const reason = searchParams?.reason || "";
  const page = parseInt(searchParams?.page || "1", 10);
  const recordsPerPage = 20;

  // Build where clause
  const whereClause: any = {};

  if (startDate) {
    whereClause.createdAt = { ...whereClause.createdAt, gte: startDate };
  }
  if (endDate) {
    whereClause.createdAt = { ...whereClause.createdAt, lte: endDate };
  }
  if (userId) {
    whereClause.voidedById = userId;
  }
  if (target) {
    whereClause.target = target;
  }
  if (reason) {
    whereClause.reason = { contains: reason, mode: "insensitive" };
  }

  // Fetch records with pagination
  const [voidRecords, totalRecords] = await Promise.all([
    prisma.voidRecord.findMany({
      where: whereClause,
      include: {
        voidedBy: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * recordsPerPage,
      take: recordsPerPage,
    }),
    prisma.voidRecord.count({ where: whereClause }),
  ]);

  // Fetch details for each record
  const recordsWithDetails = await Promise.all(
    voidRecords.map(async (record) => {
      const details = await getVoidDetails(record);
      return { ...record, details };
    })
  );

  // Fetch all users for filter dropdown
  const allUsers = await prisma.user.findMany({
    where: { role: { in: ["OWNER", "ADMIN", "CAJERO"] } },
    select: { id: true, name: true },
  });

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-600">
          Registro de Cancelaciones
        </h1>
        <Link
          href="/settings"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a Ajustes
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              name="startDate"
              defaultValue={searchParams?.startDate || ""}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              name="endDate"
              defaultValue={searchParams?.endDate || ""}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal
            </label>
            <select
              name="userId"
              defaultValue={userId}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white"
            >
              <option value="">Todos</option>
              {allUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              name="target"
              defaultValue={target}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white"
            >
              <option value="">Todos</option>
              <option value="ORDER_ITEM">Item</option>
              <option value="ORDER">Orden</option>
              <option value="CHECK">Cuenta</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo
            </label>
            <input
              type="text"
              name="reason"
              defaultValue={reason}
              placeholder="Buscar motivo..."
              className="w-full p-2 border border-gray-300 rounded text-black bg-white"
            />
          </div>
        </form>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            formAction="/settings/void-records"
            className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Results */}
      {recordsWithDetails.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">No hay registros de cancelaciones</p>
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
                      {record.voidedBy?.name || "Desconocido"}
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
                          ? "Cuenta Anulada"
                          : record.target === "ORDER"
                          ? "Orden Cancelada"
                          : "Item Anulado"}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Mostrando {(page - 1) * recordsPerPage + 1} -{" "}
                {Math.min(page * recordsPerPage, totalRecords)} de{" "}
                {totalRecords}
              </div>
              <div className="flex space-x-2">
                {page > 1 && (
                  <Link
                    href={`/settings/void-records?page=${page - 1}&startDate=${
                      startDate?.toISOString().split("T")[0] || ""
                    }&endDate=${
                      endDate?.toISOString().split("T")[0] || ""
                    }&userId=${userId}&target=${target}&reason=${reason}`}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Anterior
                  </Link>
                )}
                <span className="px-3 py-1 bg-violet-500 text-white rounded">
                  {page} de {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/settings/void-records?page=${page + 1}&startDate=${
                      startDate?.toISOString().split("T")[0] || ""
                    }&endDate=${
                      endDate?.toISOString().split("T")[0] || ""
                    }&userId=${userId}&target=${target}&reason=${reason}`}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Siguiente
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
