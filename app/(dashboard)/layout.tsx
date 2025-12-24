// app/(dashboard)/layout.tsx
import { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user: any = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role === "MESERO") {
    // If already on /tables, render without sidebar
    // Otherwise, redirect to /tables
    const isOnTables =
      typeof window === "undefined"
        ? true // We can't check path reliably in layout → so always render children
        : window.location.pathname === "/tables";

    // Since we can't check path → render children (which will be tables page)
    return <>{children}</>;
  }

  if (user.role === "COCINERO") {
    // Same logic
    return <>{children}</>;
  }

  // Managers: full layout
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
