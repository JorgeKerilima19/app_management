// app/settings/staff/StaffForm.tsx
'use client';

import { useFormState } from 'react-dom';
import { createStaffAction, type StaffFormState } from './actions';

export default function StaffForm() {
  const initialState: StaffFormState = { message: '', error: false };
  const [state, formAction] = useFormState(createStaffAction, initialState);

  return (
    <form action={formAction} className="space-y-4"> {/* ✅ formAction from useFormState */}
      {state.message && (
        <p className={`text-sm ${state.error ? 'text-red-500' : 'text-green-500'}`}>
          {state.message}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Rol
          </label>
          <select
            id="role"
            name="role"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="MESERO">Mesero</option>
            <option value="COCINERO">Cocinero</option>
            <option value="BARISTA">Barista</option>
            <option value="CAJERO">Cajero</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600 transition"
      >
        Añadir Personal
      </button>
    </form>
  );
}