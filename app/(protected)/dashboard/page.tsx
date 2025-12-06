import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (!role) redirect("/login");

  if (role === "admin" || role === "cashier") return <AdminDashboard />;
  if (role === "cook") return <CookDashboard />;
  if (role === "waiter") return <WaiterDashboard />;

  return <div>Unknown role.</div>;
}

function AdminDashboard() {
  return <div>Admin / Cashier Dashboard (full navbar)</div>;
}

function CookDashboard() {
  return <div>Cook Dashboard (recipes + kitchen view)</div>;
}

function WaiterDashboard() {
  return <div>Waiter Dashboard (phone layout + tables + menu)</div>;
}
