"use client";

import { useAuth } from "@/app/providers";
import { useEffect } from "react";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) window.location.href = "/login";
  }, [user]);

  if (!user) return null;

  return <>{children}</>;
}
