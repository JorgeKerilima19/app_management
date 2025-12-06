import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminNavbar from "@/components/nav/AdminNavbar";
import CookNavbar from "@/components/nav/CookNavbar";
import WaiterNavbar from "@/components/nav/WaiterNavbar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const logged = cookieStore.get("logged")?.value;
  const role = cookieStore.get("role")?.value;

  if (!logged) redirect("/login");

  let Navbar = null;

  if (role === "admin" || role === "cashier") Navbar = AdminNavbar;
  else if (role === "cook") Navbar = CookNavbar;
  else if (role === "waiter") Navbar = WaiterNavbar;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {Navbar && <Navbar />}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
