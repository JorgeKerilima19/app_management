// app/(auth)/dashboard/close/components/Header.tsx
"use client";

import Link from "next/link";

type Props = {
  date: Date;
  onExport: () => void;
  onBack: () => void;
};

export function Header({ date, onExport, onBack }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <h1 className="text-2xl md:text-3xl font-bold text-violet-600">
        Cierre del Día — {date.toLocaleDateString()}
      </h1>
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 bg-gray-100 rounded"
        >
          ← Volver al Dashboard
        </button>
        <button
          onClick={onExport}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
        >
          📊 Exportar a Excel
        </button>
      </div>
    </div>
  );
}
