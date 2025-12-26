// components/LogoutButton.tsx
"use client";

import { useFormStatus } from "react-dom";
import { logout } from "@/app/actions";

function LogoutButtonInner() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full text-left py-2 px-3 text-sm text-gray-300 hover:text-white hover:bg-red-600 rounded transition"
      disabled={pending}
    >
      {pending ? "Logging out..." : "Logout"}
    </button>
  );
}

export default function LogoutButton() {
  return (
    <form action={logout}>
      <LogoutButtonInner />
    </form>
  );
}
