// app/(dashboard)/tables/page.tsx
import LogoutButton from "@/components/LogoutButton";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function TablesPage() {
  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
  });

  const getTable = (num: number) => tables.find((t) => t.number === num);

  const renderTable = (num: number) => {
    const table = getTable(num);
    if (!table) return null;

    // Tables 1-5 are 6-seaters
    const is6Seater = num >= 1 && num <= 5;
    const sizeClasses = is6Seater ? "w-32 h-20" : "w-20 h-20";

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

  // ✅ EXACT layout from your ASCII (top to bottom)
  const rows = [
    { left: [12, 11, 6], right: 5 }, // top row
    { left: [13, 10, 7], right: 4 },
    { left: [14, 9, 8], right: 3 },
    { left: [15], right: 2 },
    { left: [], right: 1 }, // bottom row
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <LogoutButton />
      <h1 className="text-2xl font-bold text-violet-600 text-center mb-8">
        Vista de las mesas
      </h1>

      {/* INDOOR */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-center mb-6">Interior</h2>
        <div className="flex justify-center gap-6 mb-8">
          {/* Left: 3 columns of 4-seaters */}
          <div className="flex gap-4">
            {/* Column 1: first item of each row */}
            <div className="flex flex-col gap-4">
              {rows.map((row, idx) => (
                <div key={`col1-${idx}`}>
                  {row.left[0] ? (
                    renderTable(row.left[0])
                  ) : (
                    <div className="w-20 h-20"></div>
                  )}
                </div>
              ))}
            </div>
            {/* Column 2: second item */}
            <div className="flex flex-col gap-4">
              {rows.map((row, idx) => (
                <div key={`col2-${idx}`}>
                  {row.left[1] ? (
                    renderTable(row.left[1])
                  ) : (
                    <div className="w-20 h-20"></div>
                  )}
                </div>
              ))}
            </div>
            {/* Column 3: third item */}
            <div className="flex flex-col gap-4">
              {rows.map((row, idx) => (
                <div key={`col3-${idx}`}>
                  {row.left[2] ? (
                    renderTable(row.left[2])
                  ) : (
                    <div className="w-20 h-20"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: 6-seaters (1-5) */}
          <div className="flex flex-col justify-center gap-4 ml-12">
            {rows.map((row, idx) => (
              <div key={`right-${idx}`}>
                {row.right ? (
                  renderTable(row.right)
                ) : (
                  <div className="w-32 h-20"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OUTDOOR */}
      <div>
        <h2 className="text-xl font-semibold text-center mb-4">
          Exterior Patio
        </h2>
        <div className="flex justify-center gap-8">
          {renderTable(16)}
          {renderTable(17)}
        </div>
      </div>
    </div>
  );
}
