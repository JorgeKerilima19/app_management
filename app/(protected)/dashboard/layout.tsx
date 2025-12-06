"use client";

import { useAuth } from "@/app/providers";
import Sidebar from "@/components/Sidebar";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) window.location.href = "/login";
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar (role-based) */}
      <Sidebar role={user.role} />

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
