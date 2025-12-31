// app/register/page.tsx
"use client";

import { useFormState } from "react-dom";
import { register } from "@/app/actions";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const initialState = { error: "" };
  const [state, formAction] = useFormState(register, initialState);

  useEffect(() => {
    if (!state.error && state.error !== "") {
      router.push("/login");
    }
  }, [state.error, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-center text-violet-500 mb-6">
          Create Admin
        </h1>
        {state.error && (
          <p className="text-red-500 text-center mb-4">{state.error}</p>
        )}
        <form action={formAction} className="space-y-4">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-violet-500 text-white py-2 rounded hover:bg-violet-600 transition"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
