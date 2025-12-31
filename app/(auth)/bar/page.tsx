// app/bar/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchActiveBarOrders, fetchPreparedBarToday } from "./actions";
import BarView from "./BarView";
import LogoutButton from "@/components/LogoutButton";

export default async function BarPage() {
  const user = await getCurrentUser();
  if (!user || !["BARISTA", "CAJERO", "OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  const [active, prepared] = await Promise.all([
    fetchActiveBarOrders(),
    fetchPreparedBarToday(),
  ]);

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white min-h-screen">
      <LogoutButton />
      <h1 className="text-3xl font-bold text-violet-600 mb-6">Bar</h1>
      <BarView initialActive={active} initialPrepared={prepared} />
    </div>
  );
}
