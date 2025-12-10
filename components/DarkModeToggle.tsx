// components/DarkModeToggle.tsx
"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") === "dark";
    setDark(saved);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark"); // ← This is critical
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark, mounted]);

  if (!mounted) return <button className="opacity-0">Loading...</button>;

  return (
    <button
      onClick={() => setDark(!dark)}
      className="px-4 py-2 rounded-lg bg-violet-500 text-white"
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}