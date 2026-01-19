// app/dashboard/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchDashboardData, openRestaurant } from "./actions";
import Link from "next/link";

export async function DashboardClient() {
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

      {/* Open Restaurant */}
      {!data.dailySummary?.status || data.dailySummary.status === "CLOSED" ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Abrir Restaurante
          </h2>
          <form action={handleOpenRestaurant} className="flex gap-4">
            <input
              type="number"
              name="startingCash"
              step="0.01"
              min="0"
              placeholder="Monto de apertura"
              className="px-3 py-2 border border-gray-300 rounded text-black bg-white"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Restaurante Abierto
            </h2>
            <Link
              href="/dashboard/close"
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cerrar Día
            </Link>
          </div>
          <p className="mt-2 text-gray-600">
            Apertura: S/ {Number(data.dailySummary.startingCash).toFixed(2)}
          </p>
        </div>
      )}

      {/* Payment Summary */}
      {data.dailySummary?.status === "OPEN" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <h3 className="text-lg font-bold text-green-800">Efectivo</h3>
            <p className="text-2xl font-bold mt-2 text-gray-900">
              S/ {data.payments.totalCash.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              ({data.payments.cashPercentage.toFixed(1)}%)
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <h3 className="text-lg font-bold text-blue-800">Yape</h3>
            <p className="text-2xl font-bold mt-2 text-gray-900">
              S/ {data.payments.totalYape.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              ({data.payments.yapePercentage.toFixed(1)}%)
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <h3 className="text-lg font-bold text-purple-800">Mixto</h3>
            <p className="text-2xl font-bold mt-2 text-gray-900">
              S/ {data.payments.totalMixed.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              ({data.payments.mixedPercentage.toFixed(1)}%)
            </p>
          </div>
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-center">
            <h3 className="text-lg font-bold text-violet-800">Total</h3>
            <p className="text-2xl font-bold mt-2 text-gray-900">
              S/ {data.payments.totalOverall.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {data.dailySummary?.status === "OPEN" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Últimos Pedidos
            </h3>
            {data.recentOrders.length === 0 ? (
              <p className="text-gray-500">Sin pedidos recientes</p>
            ) : (
              <div className="space-y-3">
                {data.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between text-sm py-2 border-b border-gray-100"
                  >
                    <span className="font-medium">
                      Mesa {order.check.tables[0]?.number}
                    </span>
                    <span className="text-gray-600">
                      {order.items[0]?.menuItem.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Voids */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Anulaciones Recientes
            </h3>
            {data.recentVoids.length === 0 ? (
              <p className="text-gray-500">Sin anulaciones recientes</p>
            ) : (
              <div className="space-y-3">
                {data.recentVoids.map((voidRecord) => (
                  <div
                    key={voidRecord.id}
                    className="flex justify-between text-sm py-2 border-b border-gray-100"
                  >
                    <span className="font-medium">
                      {voidRecord.voidedBy.name}
                    </span>
                    <span className="text-gray-600">{voidRecord.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Items */}
      {data.dailySummary?.status === "OPEN" && data.topItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Ítems Más Vendidos
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ítem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.menuItem?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.menuItem?.category?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.totalQuantity}
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
