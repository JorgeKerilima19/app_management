// app/(dashboard)/settings/page.tsx
import Link from "next/link";

export default async function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-violet-500">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
          <h2 className="font-bold text-lg mb-2">Menu Management</h2>
          <p className="text-gray-600 text-sm mb-4">
            Manage categories and menu items
          </p>
          <Link
            href="/settings/menu"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm"
          >
            Configure →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
          <h2 className="font-bold text-lg mb-2">Table Management</h2>
          <p className="text-gray-600 text-sm mb-4">
            Add, remove, or modify tables
          </p>
          <Link
            href="/settings/tables"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm"
          >
            Configure →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
          <h2 className="font-bold text-lg mb-2">Staff Management</h2>
          <p className="text-gray-600 text-sm mb-4">
            Add or remove staff members
          </p>
          <Link
            href="/settings/staff"
            className="text-violet-500 hover:text-violet-700 font-medium text-sm"
          >
            Configure →
          </Link>
        </div>
      </div>
    </div>
  );
}
