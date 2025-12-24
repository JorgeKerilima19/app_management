// app/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // ✅ Redirect based on role
  if (user.role === "MESERO") {
    redirect("/tables");
  }
  if (user.role === "COCINERO") {
    redirect("/kitchen");
  }

  redirect("/dashboard");
}
