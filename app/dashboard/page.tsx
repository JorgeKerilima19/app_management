// app/dashboard/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-violet-500">Dashboard</h1>
      <p>
        Welcome, {user.name}! Role: {user.role}
      </p>
      <p className="mt-4 text-gray-600">This is a placeholder dashboard.</p>
    </div>
  );
}
