// app/dashboard/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchDashboardData, openRestaurant } from "./actions";
import Link from "next/link";

// Components (all in same folder)
import { TurnManager } from "./TurnManager";
import { PaymentSummary } from "./PaymentSummary";
import { RecentActivity } from "./RecentActivity";
import { TopItemsTable } from "./TopItemsTable";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  const data = await fetchDashboardData();

  const handleOpenRestaurant = async (formData: FormData) => {
    "use server";
    const startingCash = parseFloat(formData.get("startingCash") as string);
    if (isNaN(startingCash) || startingCash < 0) {
      throw new Error("Monto inválido");
    }
    await openRestaurant(startingCash);
    redirect("/dashboard");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-violet-600">
          Panel de Control - {data.date.toLocaleDateString()}
        </h1>
        <Link
          href="/settings"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Ajustes
        </Link>
      </div>

      {!data.dailySummary?.status || data.dailySummary.status === "CLOSED" ? (
        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Abrir Restaurante
          </h2>
          <form action={handleOpenRestaurant} className="flex gap-4">
            <input
              type="number"
              name="startingCash"
              step="0.01"
              min="0"
              placeholder="Monto de apertura"
              className="px-3 py-2 border border-gray-300 rounded text-white bg-gray-500"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Abrir
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-200">
              Restaurante Abierto
            </h2>
            <Link
              href="/dashboard/close"
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cerrar Día
            </Link>
          </div>

          <TurnManager
            dailySummary={data.dailySummary}
            activeTurn={data.activeTurn}
            turnData={data.turnData}
          />
        </div>
      )}

      {data.dailySummary?.status === "OPEN" && (
        <PaymentSummary payments={data.payments} spendings={data.spendings} />
      )}

      {/* Recent Activity */}
      {data.dailySummary?.status === "OPEN" && (
        <RecentActivity
          recentOrders={data.recentOrders}
          recentVoids={data.recentVoids}
        />
      )}

      {data.dailySummary?.status === "OPEN" && data.topItems.length > 0 && (
        <TopItemsTable topItems={data.topItems} />
      )}
    </div>
  );
}
