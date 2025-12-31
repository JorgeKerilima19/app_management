// components/LogoutButton.tsx
"use client";

import { logout } from "@/app/actions";

export default function LogoutButton() {
  return (
    <div className="absolute top-4 right-4">
      <form action={logout}>
        <button
          type="submit"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Cerrar Sesión
        </button>
      </form>
    </div>
  );
}
