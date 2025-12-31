// app/settings/staff/StaffTable.tsx
'use client';

import { useFormState } from 'react-dom';
import { deleteUserAction, type DeleteStaffState } from './actions';

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

const roleLabels: Record<string, string> = {
  OWNER: 'Dueño',
  ADMIN: 'Administrador',
  MESERO: 'Mesero',
  COCINERO: 'Cocinero',
  BARISTA: 'Barista',
  CAJERO: 'Cajero',
};

function DeleteUserForm({ id, roleName }: { id: string; roleName: string }) {
  if (roleName === 'OWNER') return null;

  const initialState: DeleteStaffState = { message: '', success: false };
  const [state, formAction] = useFormState(deleteUserAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-red-500 hover:text-red-700 text-sm"
        onClick={(e) => {
          if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) {
            e.preventDefault();
          }
        }}
      >
        Eliminar
      </button>
    </form>
  );
}

export default function StaffTable({ staff }: { staff: StaffMember[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {staff.map((member) => (
            <tr key={member.id}>
              <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{member.name}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-violet-100 text-violet-800">
                  {roleLabels[member.role] || member.role}
                </span>
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm">
                <DeleteUserForm id={member.id} roleName={member.role} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}