// app/dashboard/close/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchClosingSummary } from "./actions";
import CloseClient from "./CloseClient";

export default async function ClosingDashboardPage({
  searchParams,
}: {
  searchParams?: { categoryId?: string };
}) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  const categoryId = searchParams?.categoryId;
  const data = await fetchClosingSummary(categoryId);

  return <CloseClient initialData={data} />;
}
