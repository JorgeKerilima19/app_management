"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Role = "admin" | "cashier" | "cook" | "waiter";

interface User {
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("session_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = (email: string, role: Role) => {
    const user = { email, role };
    localStorage.setItem("session_user", JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("session_user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
};
