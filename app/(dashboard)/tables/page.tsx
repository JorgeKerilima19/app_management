// app/(dashboard)/tables/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function TablesPage() {
  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
  });

  const getTable = (num: number) => tables.find((t) => t.number === num);

  // Helper: render a table block
  const renderTable = (num: number) => {
    const table = getTable(num);
    if (!table) return null;

    // 6-seaters: wider rectangle | 4-seaters: square
    const is6Seater = num >= 11 && num <= 15;
    const sizeClasses = is6Seater
      ? "w-32 h-20" // wide rectangle
      : "w-20 h-20"; // square

    return (
      <Link key={table.id} href={`/tables/${table.id}`}>
        <div
          className={`${sizeClasses} rounded-lg border-2 flex items-center justify-center font-bold cursor-pointer transition transform hover:scale-105 ${
            table.status === "AVAILABLE"
              ? "bg-white border-gray-300 text-gray-800"
              : "bg-green-500 border-green-600 text-white"
          }`}
        >
          {table.number}
        </div>
      </Link>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-violet-600 text-center mb-8">
        Tables Overview
      </h1>

      {/* INDOOR */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-center mb-6">
          Indoor Dining
        </h2>

        {/* LEFT SIDE: 4-seaters */}
        <div className="flex justify-center gap-6 mb-8">
          {/* Column 1: 4 tables */}
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }, (_, i) => renderTable(i + 1))}
          </div>
          {/* Columns 2 & 3: 3 tables each */}
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }, (_, i) => renderTable(i + 5))}
          </div>
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }, (_, i) => renderTable(i + 8))}
          </div>

          {/* RIGHT SIDE: 6-seaters — centered vertically */}
          <div className="flex flex-col justify-center gap-4 ml-12">
            {Array.from({ length: 5 }, (_, i) => renderTable(i + 11))}
          </div>
        </div>
      </div>

      {/* OUTDOOR (at bottom, centered) */}
      <div>
        <h2 className="text-xl font-semibold text-center mb-4">
          Outdoor Patio
        </h2>
        <div className="flex justify-center gap-8">
          {renderTable(16)}
          {renderTable(17)}
        </div>
      </div>
    </div>
  );
}
