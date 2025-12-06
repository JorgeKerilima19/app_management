"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: any) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      setError("Invalid username or password.");
      return;
    }

    const data = await res.json();

    // redirect by role
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form
        onSubmit={submit}
        className="w-[320px] border p-6 rounded-xl shadow-sm bg-white"
      >
        <h1 className="text-xl font-semibold mb-4">Login</h1>

        <input
          type="text"
          placeholder="User"
          value={username}
          onChange={(e) => setUser(e.target.value)}
          className="w-full mb-3 p-2 border rounded-md"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPass(e.target.value)}
          className="w-full mb-3 p-2 border rounded-md"
        />

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button className="w-full bg-black text-white p-2 rounded-md">
          Login
        </button>
      </form>
    </div>
  );
}
