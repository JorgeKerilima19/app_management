"use client";

import { loginAction } from "../auth/login/actions";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <form
        action={loginAction}
        className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md border border-gray-200"
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-violet-500">
          Iniciar Sesión
        </h1>

        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            className="w-full p-3 border border-gray-300 rounded-lg text-black"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            name="password"
            className="w-full p-3 border border-gray-300 rounded-lg text-black"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-semibold transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
