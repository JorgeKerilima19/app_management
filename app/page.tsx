// app/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  switch (user.role) {
    case "OWNER":
    case "ADMIN":
      redirect("/inventory");
    case "MESERO":
      redirect("/tables");
    case "COCINERO":
      redirect("/kitchen");
    case "BARISTA":
      redirect("/bar");
    case "CAJERO":
      redirect("/cashier");
    default:
      redirect("/login");
  }
}
