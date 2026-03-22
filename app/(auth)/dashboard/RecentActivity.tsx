// app/dashboard/RecentActivity.tsx
"use client";

interface RecentActivityProps {
  recentOrders: any[];
  recentVoids: any[];
}

export function RecentActivity({
  recentOrders,
  recentVoids,
}: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Últimos Pedidos
        </h3>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500">Sin pedidos recientes</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex justify-between items-start text-sm py-2 border-b border-gray-100"
              >
                <div className="flex-1">
                  <span className="font-medium text-gray-900">
                    Mesa {order.tableName}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.firstItemName || "Sin items"}
                  </p>
                </div>
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
        {recentVoids.length === 0 ? (
          <p className="text-gray-500">Sin anulaciones recientes</p>
        ) : (
          <div className="space-y-3">
            {recentVoids.map((voidRecord) => (
              <div
                key={voidRecord.id}
                className="flex justify-between items-start text-sm py-2 border-b border-gray-100"
              >
                <div className="flex-1">
                  <span className="font-medium text-gray-900">
                    {voidRecord.targetDetails || "Desconocido"}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {voidRecord.voidedBy?.name || "Desconocido"}
                    {voidRecord.voidedBy?.role &&
                      ` (${voidRecord.voidedBy.role})`}
                    {" • "}
                    {voidRecord.reason || "Sin motivo"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
