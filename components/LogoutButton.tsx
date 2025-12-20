// components/LogoutButton.tsx (client-only alternative)
"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left py-2 px-4 text-sm text-gray-300 hover:text-white hover:bg-red-600 rounded"
    >
      Logout
    </button>
  );
}
