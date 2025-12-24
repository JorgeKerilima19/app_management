// app/(dashboard)/settings/tables/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";
import { CreateTableButton } from "./_components/buttons";
import { DeleteTableForm, EditTableForm } from "./_components/forms";

export default async function TableSettingsPage() {
  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-500">
          Administrar Mesas
        </h1>
        <Link
          href="/settings"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a Ajustes
        </Link>
      </div>

      <CreateTableButton />

      {tables.length === 0 ? (
        <p className="text-gray-500">Sin mesas actualmente</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="border border-gray-200 rounded p-4 text-center"
            >
              <p className="font-bold text-lg">Mesa {table.number}</p>
              <p className="text-sm text-gray-600">
                Capacidad: {table.capacity}
              </p>
              <p className="text-xs mt-1 px-2 py-1 bg-gray-100 rounded inline-block">
                {table.status}
              </p>
              <div className="mt-3 flex justify-center">
                <EditTableForm table={table} />
                <DeleteTableForm id={table.id} tableNumber={table.number} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
