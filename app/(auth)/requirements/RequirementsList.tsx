"use client";

import { useState } from "react";
import { cancelRequirement } from "./actions";
import type { DailyRequirement } from "./actions";
import ConfirmDialog from "./ConfirmDialog";

type Props = {
  requirements: DailyRequirement[];
  canCancel: boolean;
  currentUserId: string;
  currentUserRole: string;
};

function formatLimaDate(
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Date(date).toLocaleDateString("es-PE", {
    timeZone: "America/Lima",
    ...options,
  });
}

export default function RequirementsList({
  requirements,
  canCancel,
  currentUserId,
  currentUserRole,
}: Props) {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: async () => {},
  });

  const handleCancel = async (requirementId: string) => {
    const formData = new FormData();
    formData.append("requirementId", requirementId);
    try {
      await cancelRequirement(formData);
      alert("✅ Requerimiento cancelado");
      window.location.reload();
    } catch (e) {
      alert("Error: " + (e as Error).message);
    }
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => Promise<void>,
    isDanger = false,
  ) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm, isDanger });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-blue-100 text-blue-800",
      PARTIALLY_DELIVERED: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-100 text-gray-800 line-through",
    };
    const labels: Record<string, string> = {
      PENDING: "Pendiente",
      PARTIALLY_DELIVERED: "Entrega Parcial",
      DELIVERED: "Entregado",
      CANCELLED: "Cancelado",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ""}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (requirements.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-600 mb-2">No se encontraron requerimientos</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {requirements.map((req) => {
          const isPending = req.status === "PENDING";
          const canCancelReq = isPending && canCancel;
          const canEdit = ["CAJERO", "COCINERO", "OWNER", "ADMIN"].includes(
            currentUserRole,
          );

          return (
            <div
              key={req.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {formatLimaDate(req.date, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Creado por {req.createdBy.name} •{" "}
                      {formatLimaDate(req.createdAt, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {getStatusBadge(req.status)}
                </div>
              </div>

              {/* Notes */}
              {req.notes && (
                <div className="px-4 py-2 bg-violet-50 text-sm text-violet-800 border-b border-violet-100">
                  📝 {req.notes}
                </div>
              )}

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Ingrediente
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Solicitado
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Entregado
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Notas
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {req.items.map((item) => {
                      const remaining =
                        item.quantityRequested - item.quantityDelivered;
                      const isFullyDelivered = remaining <= 0;
                      const itemStatus = isFullyDelivered
                        ? "Completado"
                        : req.status === "PENDING"
                          ? "Pendiente"
                          : "En proceso";

                      return (
                        <tr
                          key={item.id}
                          className={isFullyDelivered ? "bg-green-50" : ""}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-medium">
                              {item.inventoryItem.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.inventoryItem.category}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                            {item.quantityRequested} {item.inventoryItem.unit}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span
                              className={
                                isFullyDelivered
                                  ? "text-green-700 font-medium"
                                  : "text-gray-600"
                              }
                            >
                              {item.quantityDelivered} /{" "}
                              {item.quantityRequested}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.notes || "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${isFullyDelivered ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                            >
                              {itemStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {req.items.length} item{req.items.length !== 1 ? "s" : ""} •{" "}
                  {
                    req.items.filter(
                      (i) => i.quantityDelivered >= i.quantityRequested,
                    ).length
                  }{" "}
                  completado
                  {req.items.filter(
                    (i) => i.quantityDelivered >= i.quantityRequested,
                  ).length !== 1
                    ? "s"
                    : ""}
                </span>
                {req.status === "DELIVERED" && (
                  <span className="text-green-700 font-medium">
                    ✓ Completado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDanger={confirmDialog.isDanger}
        onConfirm={async () => {
          await confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </>
  );
}
