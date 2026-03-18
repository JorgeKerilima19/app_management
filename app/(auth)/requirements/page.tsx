// app/(auth)/requirements/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getDailyRequirements,
  getInventoryItemsForRequirements,
} from "./actions";
import RequirementsForm from "./RequirementsForm";
import RequirementsList from "./RequirementsList";

export function parseDateToLima(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function getStartOfDayLima(date: Date): Date {
  const limaStr = date.toLocaleString("en-US", { timeZone: "America/Lima" });
  const limaDate = new Date(limaStr);
  limaDate.setHours(0, 0, 0, 0);
  return limaDate;
}

export function getEndOfDayLima(date: Date): Date {
  const limaStr = date.toLocaleString("en-US", { timeZone: "America/Lima" });
  const limaDate = new Date(limaStr);
  limaDate.setHours(23, 59, 59, 999);
  return limaDate;
}

export function formatDateToLimaString(date: Date): string {
  const limaStr = date.toLocaleString("en-US", { timeZone: "America/Lima" });
  const limaDate = new Date(limaStr);
  const year = limaDate.getFullYear();
  const month = String(limaDate.getMonth() + 1).padStart(2, "0");
  const day = String(limaDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams?: {
    date?: string;
    status?: string;
    view?: "list" | "form";
  };
}) {
  const user = await getCurrentUser();
  if (!user || !["CAJERO", "COCINERO", "OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  const startDate = searchParams?.date
    ? parseDateToLima(searchParams.date)
    : getStartOfDayLima(new Date());

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30); // Show next 30 days

  const statusFilter = searchParams?.status
    ? [searchParams.status]
    : ["PENDING", "APPROVED", "PARTIALLY_DELIVERED", "DELIVERED"];

  // Fetch data
  const [requirements, inventoryItems] = await Promise.all([
    getDailyRequirements({
      startDate,
      endDate,
      status: statusFilter,
    }),
    getInventoryItemsForRequirements(),
  ]);

  // ✅ CAJERO and COCINERO can create, but NOT approve/deliver
  const canCreate = ["CAJERO", "COCINERO", "OWNER", "ADMIN"].includes(
    user.role,
  );
  const canEditPending = ["COCINERO", "OWNER", "ADMIN"].includes(user.role);
  const canCancel = ["OWNER", "ADMIN"].includes(user.role);
  const canApprove = false;
  const canDeliver = false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-violet-600">
            Requerimientos de Cocina
          </h1>
          <p className="text-sm text-gray-600">
            Solicita ingredientes para preparación futura
          </p>
        </div>
        {canCreate && searchParams?.view !== "list" && (
          <RequirementsForm inventoryItems={inventoryItems} />
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <form className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fecha
            </label>
            <input
              type="date"
              name="date"
              defaultValue={searchParams?.date || ""}
              className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Estado
            </label>
            <select
              name="status"
              defaultValue={searchParams?.status || ""}
              className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobado</option>
              <option value="PARTIALLY_DELIVERED">Entrega Parcial</option>
              <option value="DELIVERED">Entregado</option>
            </select>
          </div>
          <button
            type="submit"
            formAction="/requirements"
            className="px-4 py-2 bg-violet-500 text-white rounded text-sm hover:bg-violet-600"
          >
            Filtrar
          </button>
          {(searchParams?.date || searchParams?.status) && (
            <a
              href="/requirements"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Limpiar
            </a>
          )}
        </form>
      </div>

      {/* List */}
      <RequirementsList
        requirements={requirements}
        canEditPending={canEditPending}
        canCancel={canCancel}
        canApprove={canApprove}
        canDeliver={canDeliver}
        currentUserId={user.id}
        currentUserRole={user.role}
      />

      {/* Empty State */}
      {requirements.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600 mb-2">
            No hay requerimientos para el período seleccionado
          </p>
          {canCreate && (
            <a
              href="/requirements?view=form"
              className="text-violet-600 hover:text-violet-700 text-sm font-medium"
            >
              + Crear nuevo requerimiento
            </a>
          )}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-800">
        <strong>Nota:</strong> Los requerimientos pendientes no pueden ser
        editados, pero puedes agregar notas en caso de error. La aprobación y entrega se realiza desde el panel de
        administración.
      </div>
    </div>
  );
}
