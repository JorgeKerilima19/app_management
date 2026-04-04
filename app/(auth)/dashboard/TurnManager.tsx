// app/dashboard/TurnManager.tsx
"use client";

import { TurnModal } from "./TurnModal";

interface Turn {
  name: string;
  start: number;
  end: number | null;
  closedAt: string | null;
  closedByName?: string;
  salesSnapshot?: {
    total: number;
    cash: number;
    yape: number;
  };
}

interface TurnManagerProps {
  dailySummary: any;
  activeTurn: string | null;
  turnData: Turn[];
}

export function TurnManager({
  dailySummary,
  activeTurn,
  turnData,
}: TurnManagerProps) {
  // Helpers
  const getNextTurnName = () => {
    if (!turnData || turnData.length === 0) return "turn1";
    const numbers = turnData
      .map((t) => parseInt(t.name.replace("turn", "")))
      .filter((n) => !isNaN(n));
    return `turn${Math.max(...numbers, 0) + 1}`;
  };

  const getNextTurnStartingCash = () => {
    if (!turnData || turnData.length === 0) {
      return Number(dailySummary?.startingCash || 0);
    }
    const lastTurn = turnData[turnData.length - 1];
    return lastTurn.end ?? lastTurn.start ?? 0;
  };

  return (
    <div className="border-t border-gray-500 pt-4">
      <h3 className="text-lg font-medium text-gray-300 mb-3">Turnos</h3>

      {activeTurn ? (
        // ✅ Active turn - show close button
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-green-600 font-medium">Turno Activo</p>
              <p className="text-lg font-bold text-gray-900">{activeTurn}</p>
              {turnData?.find((t) => t.name === activeTurn)?.start && (
                <p className="text-sm text-gray-600">
                  Inicio: S/{" "}
                  {Number(
                    turnData.find((t) => t.name === activeTurn)?.start || 0,
                  ).toFixed(2)}
                </p>
              )}
            </div>
            <TurnModal
              mode="close"
              turnName={activeTurn}
              trigger={
                <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                  Cerrar Turno
                </button>
              }
            />
          </div>
        </div>
      ) : (
        // ✅ No active turn - show open button
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-600 font-medium">
                Sin turno activo
              </p>
              <p className="text-lg text-gray-600">Inicie un nuevo turno</p>
              {turnData && turnData.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Último cierre: S/{" "}
                  {Number(getNextTurnStartingCash()).toFixed(2)}
                </p>
              )}
            </div>
            <TurnModal
              mode="open"
              turnName={getNextTurnName()}
              startingCash={getNextTurnStartingCash()}
              trigger={
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Iniciar {getNextTurnName()}
                </button>
              }
            />
          </div>
        </div>
      )}

      {/* ✅ Turn History */}
      {turnData && turnData.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Historial</p>
          <div className="space-y-2">
            {turnData.map((turn) => (
              <div
                key={turn.name}
                className="flex justify-between items-center p-3 bg-gray-50 rounded border text-sm"
              >
                <div>
                  <span className="font-medium text-gray-900">{turn.name}</span>
                  {turn.closedAt && (
                    <span className="text-xs text-gray-500 ml-2">
                      • Cerrado {new Date(turn.closedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-gray-600">
                    S/ {Number(turn.start).toFixed(2)} →{" "}
                    {turn.end ? (
                      <span className="font-medium text-gray-900">
                        S/ {Number(turn.end).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </span>
                  {turn.salesSnapshot?.total && (
                    <p className="text-xs text-gray-500">
                      Ventas: S/ {Number(turn.salesSnapshot.total).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
