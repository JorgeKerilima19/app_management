// app/tables/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function TablesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "WAITER") {
    redirect("/");
  }

  return <div>Waiter Table View</div>;
}
