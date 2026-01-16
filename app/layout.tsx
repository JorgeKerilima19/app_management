// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import AdminSidebar from "@/components/AdminNavbar";

const inter = Inter({ subsets: ["latin"] });

export const meta: Metadata = {
  title: "Restaurant POS",
  description: "LAN-based restaurant management",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const showSidebar = user && ["OWNER", "ADMIN"].includes(user.role);

  return (
    <html lang="en">
      <body className={`${inter.className} bg-white min-h-screen`}>
        {showSidebar ? (
          <div className="flex">
            <AdminSidebar user={user} />
            <main className="flex-1 p-6 bg-white">{children}</main>
          </div>
        ) : (
          <main className="p-0 md:p-4 bg-white">{children}</main>
        )}
      </body>
    </html>
  );
}
