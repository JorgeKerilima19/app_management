// app/settings/staff/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import StaffForm from "./StaffForm";
import StaffTable from "./StaffTable";

export default async function StaffManagementPage() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

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
    <div className="space-y-8 bg-white">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-violet-500">Administrar Personal</h1>
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