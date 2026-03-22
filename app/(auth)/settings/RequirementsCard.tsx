"use client";

import { useState } from "react";
import {
  cancelRequirement,
  deliverRequirementItem,
  removeRequirementItem,
} from "../requirements/actions";

type Requirement = {
  id: string;
  date: Date;
  status: string;
  notes: string | null;
  createdBy: { name: string; role: string };
  approvedBy: { name: string } | null;
  items: {
    id: string;
    quantityRequested: number;
    quantityDelivered: number;
    notes: string | null;
    inventoryItem: {
      id: string;
      name: string;
      currentQuantity: number;
      unit: string;
      category: string | null;
    };
  }[];
};

type Props = {
  requirements: Requirement[];
  userRole: string;
};

export default function RequirementsCard({ requirements, userRole }: Props) {
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [deliverQuantity, setDeliverQuantity] = useState("");
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  // ✅ Normalize role for safe comparison
  const normalizedRole = userRole?.toUpperCase?.() || "";
  const canManage = ["OWNER", "ADMIN"].includes(normalizedRole);

  const formatDateLima = (date: Date) => {
    return new Date(date).toLocaleDateString("es-PE", {
      timeZone: "America/Lima",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDeliver = async (
    requirementItemId: string,
    maxQuantity: number,
  ) => {
    if (!deliverQuantity) return;
    const quantity = parseFloat(deliverQuantity);
    if (isNaN(quantity) || quantity <= 0 || quantity > maxQuantity) {
      alert("Cantidad inválida");
      return;
    }
    const formData = new FormData();
    formData.append("requirementItemId", requirementItemId);
    formData.append("quantity", quantity.toString());
    try {
      setDeliveringId(requirementItemId);
      await deliverRequirementItem(formData);
      alert("✅ Entregado exitosamente");
      window.location.reload();
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setDeliveringId(null);
      setDeliverQuantity("");
    }
  };

  const handleCancel = async (requirementId: string) => {
    if (!confirm("¿Cancelar este requerimiento?")) return;
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

  const handleRemoveItem = async (
    requirementItemId: string,
    itemName: string,
  ) => {
    if (!confirm(`¿Eliminar "${itemName}" de este requerimiento?`)) return;
    const formData = new FormData();
    formData.append("requirementItemId", requirementItemId);
    try {
      setRemovingItemId(requirementItemId);
      await removeRequirementItem(formData);
      alert("✅ Item eliminado del requerimiento");
      window.location.reload();
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setRemovingItemId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-blue-100 text-blue-800",
      PARTIALLY_DELIVERED: "bg-orange-100 text-orange-800",
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
        className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || ""}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (requirements.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Requerimientos de Cocina
        </h2>
        {canManage && (
          <span className="text-xs text-gray-500">Panel de Administración</span>
        )}
      </div>

      <div className="space-y-4">
        {requirements.map((req) => {
          const normalizedStatus = req.status?.toUpperCase?.() || req.status;

          // ✅ CORRECTO: Se puede cancelar solo si está PENDING
          const isPending = normalizedStatus === "PENDING";
          const canCancelReq = isPending && canManage;

          // ✅ CORRECTO: Se puede entregar si NO está DELIVERED o CANCELLED
          const canDeliverItems =
            canManage &&
            normalizedStatus !== "DELIVERED" &&
            normalizedStatus !== "CANCELLED";

          const hasItems = req.items.length > 0;
          const allDelivered = req.items.every(
            (item) => item.quantityDelivered >= item.quantityRequested,
          );

          return (
            <div key={req.id} className="border border-gray-200 rounded-lg p-4">
              {/* Header */}
              <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {formatDateLima(req.date)}
                    </span>
                    {getStatusBadge(req.status)}
                  </div>
                  <p className="text-sm text-gray-500">
                    Solicitado por: {req.createdBy.name} ({req.createdBy.role})
                  </p>
                  {req.notes && (
                    <p className="text-sm text-gray-600 mt-1">📝 {req.notes}</p>
                  )}
                </div>

                {/* Requirement-level Actions */}
                {canCancelReq && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    X Cancelar
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {req.items.map((item) => {
                  const remaining =
                    item.quantityRequested - item.quantityDelivered;
                  const isDelivering = deliveringId === item.id;
                  const isRemoving = removingItemId === item.id;
                  const isFullyDelivered = remaining <= 0;

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-wrap justify-between items-center p-2 rounded ${isFullyDelivered ? "bg-green-50" : "bg-gray-50"}`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900">
                          {item.inventoryItem.name}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          {item.quantityDelivered} / {item.quantityRequested}{" "}
                          {item.inventoryItem.unit}
                        </span>
                        {item.notes && (
                          <span className="text-xs text-gray-500 block mt-1">
                            "{item.notes}"
                          </span>
                        )}
                        {!isFullyDelivered && canDeliverItems && (
                          <span className="text-xs text-orange-600 block mt-1">
                            Faltan: {remaining} {item.inventoryItem.unit}
                          </span>
                        )}
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        {/* ✅ Deliver Button - Shows for PENDING, PARTIALLY_DELIVERED */}
                        {canDeliverItems && !isFullyDelivered ? (
                          isDelivering ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={remaining}
                                value={deliverQuantity}
                                onChange={(e) =>
                                  setDeliverQuantity(e.target.value)
                                }
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
                                placeholder="Cant."
                                autoFocus
                              />
                              <button
                                onClick={() =>
                                  handleDeliver(item.id, remaining)
                                }
                                disabled={!deliverQuantity || isRemoving}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => {
                                  setDeliveringId(null);
                                  setDeliverQuantity("");
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeliveringId(item.id)}
                              disabled={isRemoving}
                              className="px-3 py-1 bg-violet-600 text-white rounded text-sm hover:bg-violet-700 disabled:opacity-50"
                            >
                              Entregar ({remaining} {item.inventoryItem.unit})
                            </button>
                          )
                        ) : isFullyDelivered ? (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Completado
                          </span>
                        ) : normalizedStatus === "DELIVERED" ? (
                          <span className="text-xs text-gray-400">
                            Requerimiento completado
                          </span>
                        ) : normalizedStatus === "CANCELLED" ? (
                          <span className="text-xs text-gray-400">
                            Cancelado
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Sin acciones
                          </span>
                        )}

                        {/* ✅ DELETE ITEM BUTTON - Only for OWNER/ADMIN, when not fully delivered */}
                        {canManage &&
                        !isFullyDelivered &&
                        normalizedStatus !== "CANCELLED" ? (
                          <button
                            onClick={() =>
                              handleRemoveItem(item.id, item.inventoryItem.name)
                            }
                            disabled={isRemoving || isDelivering}
                            className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Eliminar este item del requerimiento"
                          >
                            {isRemoving ? "…" : "X"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                <span>
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
                {allDelivered && normalizedStatus !== "PENDING" && (
                  <span className="text-green-600 font-medium">
                    ✓ Todo entregado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
