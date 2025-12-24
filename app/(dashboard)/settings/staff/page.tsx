// app/(dashboard)/settings/staff/page.tsx

import prisma from "@/lib/prisma";
import StaffForm from "./StaffForm";
import StaffTable from "./StaffTable";

export default async function StaffManagementPage() {
  const staff = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-600">Administrar Personal</h1>
        <a
          href="/settings"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver a ajustes
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Añadir nuevo Personal
        </h2>
        <StaffForm />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Personal Actual
        </h2>
        <StaffTable staff={staff} />
      </div>
    </div>
  );
}
