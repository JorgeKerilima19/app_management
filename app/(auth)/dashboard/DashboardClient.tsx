// app/dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import { fetchDashboardData, openRestaurant, closeRestaurant } from "./actions";

export function DashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [startingCash, setStartingCash] = useState("");
  const [closingData, setClosingData] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const freshData = await fetchDashboardData();
      setData(freshData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenRestaurant = async () => {
    const cash = parseFloat(startingCash);
    if (isNaN(cash) || cash < 0) {
      alert("Por favor ingrese un monto válido");
      return;
    }

    try {
      await openRestaurant(cash);
      setStartingCash("");
      setOpenModalOpen(false);
      loadData();
    } catch (error: any) {
      alert(error.message || "Error al abrir el restaurante");
    }
  };

  const handleCloseRestaurant = async () => {
    if (!data?.dailySummary) {
      alert("No hay resumen diario activo");
      return;
    }

    try {
      const result = await closeRestaurant();
      setClosingData(result);
      loadData();
    } catch (error: any) {
      alert(error.message || "Error al cerrar el restaurante");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando dashboard...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-red-500">
        Error al cargar los datos
      </div>
    );
  }

  const { dailySummary, todayStats, activity } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-violet-600">
            Panel de Control Diario
          </h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString()}
            </p>
            <p className="text-lg font-semibold" id="current-time">
              --:--:--
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className="mt-4 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Estado del Día</p>
              <p
                className={`text-lg font-bold ${
                  dailySummary?.status === "OPEN"
                    ? "text-green-600"
                    : "text-gray-600"
                }`}
              >
                {dailySummary?.status === "OPEN" ? "ABIERTO" : "CERRADO"}
              </p>
            </div>

            {dailySummary?.status === "OPEN" ? (
              <button
                onClick={handleCloseRestaurant}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cerrar Restaurante
              </button>
            ) : (
              <button
                onClick={() => setOpenModalOpen(true)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Abrir Restaurante
              </button>
            )}
          </div>

          {dailySummary && (
            <div className="mt-3 text-sm text-gray-700">
              {dailySummary.status === "OPEN" ? (
                <p>Inicio: S/ {Number(dailySummary.startingCash).toFixed(2)}</p>
              ) : (
                <p>Cierre: S/ {Number(dailySummary.endingCash).toFixed(2)}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Daily Summary Cards */}
      {dailySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Inicio</p>
            <p className="text-2xl font-bold text-gray-900">
              S/ {Number(dailySummary.startingCash).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Ventas Cash</p>
            <p className="text-2xl font-bold text-gray-900">
              S/ {Number(todayStats.cashSales).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Ventas Yape</p>
            <p className="text-2xl font-bold text-gray-900">
              S/ {Number(todayStats.yapeSales).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Cierre</p>
            <p className="text-2xl font-bold text-gray-900">
              S/ {Number(dailySummary.endingCash).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Últimos Pedidos
          </h3>
          <div className="space-y-3">
            {activity.recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay pedidos recientes
              </p>
            ) : (
              activity.recentOrders.map((order: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between text-sm py-2 border-b border-gray-100"
                >
                  <div>
                    <span className="font-medium">
                      Mesa {order.check.tables[0]?.number || "?"}
                    </span>
                    <p className="text-gray-600">
                      {order.items[0]?.menuItem.name || "Pedido"}
                    </p>
                  </div>
                  <span className="text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Anulaciones Recientes
          </h3>
          <div className="space-y-3">
            {activity.recentVoids.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay anulaciones recientes
              </p>
            ) : (
              activity.recentVoids.map((voidRecord: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between text-sm py-2 border-b border-gray-100"
                >
                  <div>
                    <span className="font-medium">
                      {voidRecord.voidedBy.name}
                    </span>
                    <p className="text-gray-600">{voidRecord.reason}</p>
                  </div>
                  <span className="text-gray-500">
                    {new Date(voidRecord.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Open Restaurant Modal */}
      {openModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Abrir Restaurante</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ingrese la cantidad de efectivo que dejará al inicio del día
            </p>
            <input
              type="number"
              step="0.01"
              value={startingCash}
              onChange={(e) => setStartingCash(e.target.value)}
              placeholder="S/ 100.00"
              className="w-full p-3 border border-gray-300 rounded text-black bg-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setOpenModalOpen(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleOpenRestaurant}
                className="flex-1 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Abrir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Closing Confirmation Modal */}
      {closingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Cierre del Día</h3>
            <div className="space-y-2 mb-4">
              <p className="text-gray-700">
                Inicio:{" "}
                <strong>
                  S/ {Number(closingData.startingCash).toFixed(2)}
                </strong>
              </p>
              <p className="text-gray-700">
                Ventas Cash:{" "}
                <strong>S/ {Number(closingData.totalCash).toFixed(2)}</strong>
              </p>
              <p className="text-gray-700">
                Ventas Yape:{" "}
                <strong>S/ {Number(closingData.totalYape).toFixed(2)}</strong>
              </p>
              <p className="text-xl font-bold text-violet-600">
                Cierre:{" "}
                <strong>S/ {Number(closingData.endingCash).toFixed(2)}</strong>
              </p>
            </div>
            <button
              onClick={() => setClosingData(null)}
              className="w-full py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
