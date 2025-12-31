// app/settings/tables/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TableForm from "./TableForm";
import TableItem from "./TableItem";

export default async function TablesSettingsPage() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  const tables = await prisma.table.findMany({
    where: { deletedAt: null }, // exclude soft-deleted
    orderBy: { number: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-500">
          Configuración de Mesas
        </h1>
        <a
          href="/settings"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a ajustes
        </a>
      </div>

      {/* Create Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Añadir Nueva Mesa
        </h2>
        <TableForm />
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <p className="text-gray-500">No hay mesas creadas.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Mesas Existentes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {tables.map((table) => (
              <TableItem key={table.id} table={table} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
