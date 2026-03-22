import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getDailyRequirements,
  getInventoryItemsForRequirements,
} from "./actions";
import RequirementsForm from "./RequirementsForm";
import RequirementsList from "./RequirementsList";

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    view?: "list" | "form";
    requirementId?: string;
  }>;
}) {
  const params = await searchParams;

  const user = await getCurrentUser();
  if (!user || !["CAJERO", "COCINERO", "OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  // ✅ Debug: log to server console
  console.log("🔍 RequirementsPage - Fetching last 36h requirements");

  const [requirements, inventoryItems] = await Promise.all([
    getDailyRequirements({
      hoursWindow: 36, // ✅ Fetch last 36 hours by createdAt
    }),
    getInventoryItemsForRequirements(),
  ]);

  // ✅ Debug: log results
  console.log("📦 Fetched requirements:", {
    count: requirements.length,
    ids: requirements.map((r) => r.id.slice(0, 8) + "..."),
    statuses: [...new Set(requirements.map((r) => r.status))],
    dateRange:
      requirements.length > 0
        ? {
            oldest:
              requirements[requirements.length - 1]?.createdAt.toISOString(),
            newest: requirements[0]?.createdAt.toISOString(),
          }
        : null,
  });

  const canCreate = ["CAJERO", "COCINERO", "OWNER", "ADMIN"].includes(
    user.role,
  );
  const canCancel = ["OWNER", "ADMIN"].includes(user.role);

  const existingRequirement = params?.requirementId
    ? requirements.find((r) => r.id === params.requirementId)
    : null;

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
        {canCreate && params?.view !== "list" && (
          <RequirementsForm
            inventoryItems={inventoryItems}
            existingRequirementId={existingRequirement?.id || null}
          />
        )}
      </div>

      {/* Filters - simplified, no status filter since we show all */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-500">
          Mostrando todos los requerimientos creados en las últimas 36 horas
        </p>
      </div>

      {/* List */}
      <RequirementsList
        requirements={requirements}
        canCancel={canCancel}
        currentUserId={user.id}
        currentUserRole={user.role}
      />

      {/* Empty State */}
      {requirements.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600 mb-2">
            No hay requerimientos en las últimas 36 horas
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
        <strong>Nota:</strong> Puedes agregar ingredientes a requerimientos
        existentes. La entrega se realiza desde el panel de administración.
      </div>
    </div>
  );
}
