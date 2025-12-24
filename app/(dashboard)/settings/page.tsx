// app/(dashboard)/settings/page.tsx
import Link from "next/link";

export default async function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-violet-500">Ajustes</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
          <h2 className="font-bold text-lg mb-2">Administrar el Menú</h2>
          <p className="text-gray-600 text-sm mb-4">
            Añade o quita items del menú
          </p>
          <Link
            href="/settings/menu"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm"
          >
            Configurar →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
          <h2 className="font-bold text-lg mb-2">Administrar Mesas</h2>
          <p className="text-gray-600 text-sm mb-4">
            Añade, quita o renombra mesas
          </p>
          <Link
            href="/settings/tables"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm"
          >
            Configurar →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
          <h2 className="font-bold text-lg mb-2">Administrar Personal</h2>
          <p className="text-gray-600 text-sm mb-4">Añade o quita personal</p>
          <Link
            href="/settings/staff"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm"
          >
            Configurar →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
          <h2 className="font-bold text-lg mb-2">Reporte de ventas</h2>
          <p className="text-gray-600 text-sm mb-4">
            Ver reportes diarios, semanales y mensuales.
          </p>
          <Link
            href="/settings/reports"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm"
          >
            Ver Reportes →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
          <h2 className="font-bold text-lg mb-2">Record de cancelaciones</h2>
          <p className="text-gray-600 text-sm mb-4">
            Ver cancelaciones de items u ordenes
          </p>
          <Link
            href="/settings/void-records"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm"
          >
            Ver Record →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
          <h2 className="font-bold text-lg mb-2">
            Añadir nuevas configuraciones
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Contacta whatssap +51 949316792
          </p>
          <span className="text-violet-500 hover:text-violet-700 font-medium text-sm">
            Soporte o nuevas funcionalidades
          </span>
        </div>
      </div>
    </div>
  );
}
