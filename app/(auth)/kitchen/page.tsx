// app/kitchen/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchActiveKitchenOrders, fetchPreparedToday } from "./actions";
import KitchenView from "./KitchenView";

export default async function KitchenPage() {
  const user = await getCurrentUser();
  if (!user || !["COCINERO", "CAJERO", "OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  const [active, prepared] = await Promise.all([
    fetchActiveKitchenOrders(),
    fetchPreparedToday(),
  ]);

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-violet-600 mb-6">Cocina</h1>
      <KitchenView initialActive={active} initialPrepared={prepared} />
    </div>
  );
}
