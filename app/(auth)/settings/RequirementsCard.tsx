/// app/(auth)/settings/RequirementsCard.tsx
"use client";

import { useState } from "react";
import { deliverRequirementItem, cancelRequirement } from "../kitchen/actions";

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
      alert("Entregado exitosamente. Stock transferido a inventario.");
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
      window.location.reload();
    } catch (e) {
      alert("Error: " + (e as Error).message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
            Pendiente
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
            Aprobado
          </span>
        );
      case "PARTIALLY_DELIVERED":
        return (
          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-medium">
            Parcial
          </span>
        );
      case "DELIVERED":
        return (
          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
            Entregado
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
            Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (requirements.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Necesario para Mañana
        </h2>
      </div>

      <div className="space-y-4">
        {requirements.map((req) => (
          <div key={req.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {formatDate(req.date)}
                  </span>
                  {getStatusBadge(req.status)}
                </div>
                <p className="text-sm text-gray-500">
                  Solicitado por: {req.createdBy.name} ({req.createdBy.role})
                </p>
                {req.approvedBy && (
                  <p className="text-sm text-gray-500">
                    Aprobado por: {req.approvedBy.name}
                  </p>
                )}
                {req.notes && (
                  <p className="text-sm text-gray-600 mt-1">
                    Nota: {req.notes}
                  </p>
                )}
              </div>
              {req.status === "PENDING" &&
                ["OWNER", "ADMIN"].includes(userRole) && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Cancelar
                  </button>
                )}
            </div>

            <div className="space-y-2">
              {req.items.map((item) => {
                const remaining =
                  item.quantityRequested - item.quantityDelivered;
                const isDelivering = deliveringId === item.id;

                return (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.inventoryItem.name}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        {item.quantityDelivered} / {item.quantityRequested}{" "}
                        {item.inventoryItem.unit}
                      </span>
                      {item.notes && (
                        <span className="text-xs text-gray-500 block">
                          "{item.notes}"
                        </span>
                      )}
                      {remaining > 0 && (
                        <span className="text-xs text-orange-600">
                          Faltan: {remaining} {item.inventoryItem.unit}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {remaining > 0 &&
                      ["OWNER", "ADMIN"].includes(userRole) ? (
                        isDelivering ? (
                          <>
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
                            />
                            <button
                              onClick={() => handleDeliver(item.id, remaining)}
                              disabled={!deliverQuantity}
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
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeliveringId(item.id)}
                            className="px-3 py-1 bg-violet-600 text-white rounded text-sm hover:bg-violet-700"
                            title="Transferir desde Almacén a Inventario"
                          >
                            Entregar
                          </button>
                        )
                      ) : remaining === 0 ? (
                        <span className="text-xs text-green-600 font-medium">
                          Completado
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Pendiente</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
