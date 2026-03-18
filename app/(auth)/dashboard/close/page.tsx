// app/(auth)/dashboard/close/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { fetchClosingSummary } from "./actions";
import CloseClient from "./CloseClient";

export default async function ClosePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; categoryId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN", "CAJERO"].includes(user.role)) {
    redirect("/login");
  }

  const { page, categoryId } = await searchParams;
  const currentPage = page ? parseInt(page, 10) : 1;
  const itemsPerPage = 20;

  const data = await fetchClosingSummary(categoryId, currentPage, itemsPerPage);

  return <CloseClient initialData={data} />;
}
