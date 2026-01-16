// app/settings/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <div className="space-y-8 bg-white">
      <h1 className="text-2xl font-bold text-violet-500">Ajustes</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition hover:border-violet-300 bg-white">
          <h2 className="font-bold text-lg mb-2 text-gray-700">Administrar el Menú</h2>
          <p className="text-gray-600 text-sm mb-4">
            Añade o quita items del menú
          </p>
          <Link
            href="/settings/menu"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm flex items-center gap-1"
          >
            Configurar →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition hover:border-violet-300 bg-white">
          <h2 className="font-bold text-lg mb-2 text-gray-700">Administrar Mesas</h2>
          <p className="text-gray-600 text-sm mb-4">
            Añade, quita o renombra mesas
          </p>
          <Link
            href="/settings/tables"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm flex items-center gap-1"
          >
            Configurar →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition hover:border-violet-300 bg-white">
          <h2 className="font-bold text-lg mb-2 text-gray-700">Administrar Personal</h2>
          <p className="text-gray-600 text-sm mb-4">Añade o quita personal</p>
          <Link
            href="/settings/staff"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm flex items-center gap-1"
          >
            Configurar →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition hover:border-violet-300 bg-white">
          <h2 className="font-bold text-lg mb-2 text-gray-700">Reporte de ventas</h2>
          <p className="text-gray-600 text-sm mb-4">
            Ver reportes diarios, semanales y mensuales.
          </p>
          <Link
            href="/settings/reports"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm flex items-center gap-1"
          >
            Ver Reportes →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition hover:border-violet-300 bg-white">
          <h2 className="font-bold text-lg mb-2 text-gray-700">Record de cancelaciones</h2>
          <p className="text-gray-600 text-sm mb-4">
            Ver cancelaciones de items u ordenes
          </p>
          <Link
            href="/settings/void-records"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm flex items-center gap-1"
          >
            Ver Record →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition hover:border-violet-300 bg-gray-50">
          <h2 className="font-bold text-lg mb-2 text-gray-700">
            Soporte y Nuevas Funcionalidades
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Contacta WhatsApp: +51 949 316 792
          </p>
          <span className="text-violet-600 font-medium text-sm">
            Soporte técnico o solicitudes personalizadas
          </span>
        </div>
      </div>
    </div>
  );
}
