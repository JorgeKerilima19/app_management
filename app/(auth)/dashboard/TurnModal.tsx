// app/dashboard/TurnModal.tsx
"use client";

import { useState, useTransition, FormEvent } from "react";
import { openTurn, closeTurn } from "./actions";

interface TurnModalProps {
  mode: "open" | "close";
  turnName: string;
  startingCash?: number;
  trigger: React.ReactNode;
}

export function TurnModal({
  mode,
  turnName,
  startingCash = 0,
  trigger,
}: TurnModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [declaredCash, setDeclaredCash] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        if (mode === "open") {
          await openTurn(parseFloat(declaredCash), turnName);
        } else {
          await closeTurn(turnName, parseFloat(declaredCash), note);
        }
        setIsOpen(false);
        setDeclaredCash("");
        setNote("");
      } catch (err: any) {
        setError(err.message || "Error al procesar");
      }
    });
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{trigger}</div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {mode === "open" ? `Iniciar ${turnName}` : `Cerrar ${turnName}`}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "open" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Efectivo inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={declaredCash}
                    onChange={(e) => setDeclaredCash(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-white"
                    placeholder="0.00"
                    required
                    autoFocus
                  />
                  {startingCash > 0 && (
                    <p className="text-xs text-gray-200 mt-1">
                      Sugerido: S/ {startingCash.toFixed(2)} (cierre anterior)
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-100 mb-1">
                      Efectivo declarado
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={declaredCash}
                      onChange={(e) => setDeclaredCash(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-white"
                      placeholder="0.00"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-white"
                      rows={2}
                      placeholder="Observaciones..."
                    />
                  </div>
                </>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-100"
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded disabled:opacity-50"
                >
                  {isPending
                    ? "Procesando..."
                    : mode === "open"
                      ? "Iniciar"
                      : "Cerrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
