// app/dashboard/close/CloseClient.tsx
"use client";

import { useState, useTransition } from "react";
import { closeRestaurant } from "./actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

type MenuItem = {
  id: string;
  name: string;
  category: { name: string } | null;
};

type ClosingData = {
  dailySummary: {
    id: string;
    startingCash: number;
    endingCash: number;
    status: "OPEN" | "CLOSED";
  } | null;
  sales: {
    totalCash: number;
    totalYape: number;
  };
  itemsSold: {
    menuItem: MenuItem | null;
    totalQuantity: number;
  }[];
  inventoryChanges: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    category: string | null;
    notes: string | null;
    updatedAt: Date;
  }[];
  categories: {
    id: string;
    name: string;
  }[];
  voidRecords: {
    id: string;
    voidedBy: { name: string } | null;
    target: string;
    reason: string;
    createdAt: Date;
  }[];
  date: Date;
};

export default function CloseClient({
  initialData,
}: {
  initialData: ClosingData;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // ✅ Client-side state

  const handleClose = () => {
    startTransition(async () => {
      try {
        await closeRestaurant();
        router.push("/dashboard");
      } catch (error) {
        console.error("Error closing restaurant:", error);
        alert("Error al cerrar el día");
      }
    });
  };

  const totalSales = initialData.sales.totalCash + initialData.sales.totalYape;
  const closingAmount =
    totalSales - (initialData.dailySummary?.startingCash || 0);

  // ✅ Client-side filtering
  const filteredItems = selectedCategory
    ? initialData.itemsSold.filter(
        (item) => item.menuItem?.category?.name === selectedCategory,
      )
    : initialData.itemsSold;

  return (
    <div className="space-y-8 p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-violet-600">
          Cierre del Día — {initialData.date.toLocaleDateString()}
        </h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Close Button */}
      {initialData.dailySummary?.status === "OPEN" && (
        <div className="text-center">
          <button
            onClick={handleClose}
            disabled={isPending}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-lg font-medium"
          >
            {isPending ? "Cerrando..." : "Confirmar Cierre"}
          </button>
        </div>
      )}

      {/* Daily Summary */}
      {initialData.dailySummary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Resumen Diario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <h3 className="text-lg font-bold text-blue-800">Apertura</h3>
              <p className="text-xl md:text-2xl font-bold mt-2 text-gray-900">
                S/ {initialData.dailySummary.startingCash.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <h3 className="text-lg font-bold text-green-800">Ventas Cash</h3>
              <p className="text-xl md:text-2xl font-bold mt-2 text-gray-900">
                S/ {initialData.sales.totalCash.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <h3 className="text-lg font-bold text-purple-800">Ventas Yape</h3>
              <p className="text-xl md:text-2xl font-bold mt-2 text-gray-900">
                S/ {initialData.sales.totalYape.toFixed(2)}
              </p>
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-center">
              <h3 className="text-lg font-bold text-violet-800">Cierre</h3>
              <p className="text-xl md:text-2xl font-bold mt-2 text-gray-900">
                S/ {closingAmount.toFixed(2)}
              </p>
            </div>
          </div>
          {initialData.dailySummary.status === "CLOSED" && (
            <div className="mt-4 text-center">
              <p className="text-xl font-bold text-violet-600">
                Cierre Final: S/{" "}
                {initialData.dailySummary.endingCash.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Items Sold */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Ítems Vendidos (
          {filteredItems.reduce((sum, item) => sum + item.totalQuantity, 0)})
        </h2>

        {/* ✅ Client-Side Category Filter */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                !selectedCategory
                  ? "bg-violet-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Todas
            </button>
            {initialData.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedCategory === cat.name
                    ? "bg-violet-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <p className="text-gray-500">No se vendieron ítems hoy.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Ítem
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Platos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.menuItem?.name || "Desconocido"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.menuItem?.category?.name || "Otro"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.totalQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inventory Changes */}
      {initialData.inventoryChanges.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Cambios en Inventario ({initialData.inventoryChanges.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Última Modificación
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {initialData.inventoryChanges.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.category || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.updatedAt.toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Void Records */}
      {initialData.voidRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Anulaciones ({initialData.voidRecords.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Personal
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Motivo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Hora
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {initialData.voidRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.voidedBy?.name || "Desconocido"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {record.target}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {record.reason}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleTimeString()}
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
