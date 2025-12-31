// app/tables/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default async function TablesPage() {
  const user = await getCurrentUser();
  if (!user || !["MESERO", "CAJERO", "OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  const tables = await prisma.table.findMany({
    where: { deletedAt: null },
    orderBy: { number: "asc" },
  });

  const getTable = (num: number) => tables.find((t) => t.number === num);

  const renderTable = (num: number) => {
    const table = getTable(num);
    if (!table) return null;

    // ✅ Use `capacity` from DB: 4 = square, 8 = rectangle
    const is8Seater = table.capacity === 8;
    const sizeClasses = is8Seater ? "w-32 h-20" : "w-20 h-20";

    // ✅ Status-based styling
    const statusClasses =
      table.status === "AVAILABLE"
        ? "bg-white border-gray-300 text-gray-800"
        : "bg-green-500 border-green-600 text-white";

    return (
      <Link key={table.id} href={`/tables/${table.id}`}>
        <div
          className={`${sizeClasses} rounded-lg border-2 flex items-center justify-center font-bold cursor-pointer transition transform hover:scale-105 ${statusClasses}`}
          title={`${table.name || `Mesa ${table.number}`} - ${
            table.capacity
          } personas`}
        >
          {table.number}
        </div>
      </Link>
    );
  };

  // Layout
  const rows = [
    { left: [12, 11, 6], right: 5 },
    { left: [13, 10, 7], right: 4 },
    { left: [14, 9, 8], right: 3 },
    { left: [15], right: 2 },
    { left: [], right: 1 },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto bg-white min-h-screen">
      <LogoutButton />
      <h1 className="text-2xl font-bold text-violet-500 text-center mb-8">
        Vista de las Mesas
      </h1>

      {/* INDOOR */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-center mb-6 text-gray-900">
          Interior
        </h2>
        <div className="flex justify-center gap-3 mb-8">
          {/* Left: 3 columns of 4-seaters */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-4">
              {rows.map((row, idx) => (
                <div key={`col1-${idx}`}>
                  {row.left[0] ? (
                    renderTable(row.left[0])
                  ) : (
                    <div className="w-20 h-20" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              {rows.map((row, idx) => (
                <div key={`col2-${idx}`}>
                  {row.left[1] ? (
                    renderTable(row.left[1])
                  ) : (
                    <div className="w-20 h-20" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              {rows.map((row, idx) => (
                <div key={`col3-${idx}`}>
                  {row.left[2] ? (
                    renderTable(row.left[2])
                  ) : (
                    <div className="w-20 h-20" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: 8-seaters (1-5) */}
          <div className="flex flex-col justify-center gap-4 ml-6">
            {rows.map((row, idx) => (
              <div key={`right-${idx}`}>
                {row.right ? (
                  renderTable(row.right)
                ) : (
                  <div className="w-32 h-20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OUTDOOR */}
      <div>
        <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">
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
