// app/login/page.tsx
"use client";

import { login, LoginState } from "@/app/actions";
import { useFormState, useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-violet-500 text-white py-2 rounded hover:bg-violet-600 transition"
    >
      {pending ? "Logging in..." : "Login"}
    </button>
  );
}

export default function LoginPage() {
  const initialState: LoginState = { success: true };
  const [state, formAction] = useFormState(login, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form action={formAction} className="w-full max w-sm space-y-4 p-6">
        <h1 className="text-2xl font-bold text-violet-500 text-center">
          Login
        </h1>

        {state.message && (
          <p className="text-red-500 text-center">{state.message}</p>
        )}

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
          required
        />

        <SubmitButton />

        <p className="text-center mt-4">
          Don’t have an account?{" "}
          <a href="/register" className="text-violet-500 hover:underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
}
