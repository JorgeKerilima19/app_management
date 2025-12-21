// app/(dashboard)/settings/staff/StaffTable.tsx
"use client";

import { deleteStaffAction } from "./actions";

export default function StaffTable({ staff }: { staff: any[] }) {
  if (staff.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">No staff members yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
            <th className="pb-3 font-medium">Name</th>
            <th className="pb-3 font-medium">Email</th>
            <th className="pb-3 font-medium">Role</th>
            <th className="pb-3 font-medium">Added</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {staff.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="py-3 font-medium text-gray-900">{user.name}</td>
              <td className="py-3 text-gray-600">{user.email}</td>
              <td className="py-3">
                <span className="px-2.5 py-0.5 bg-violet-100 text-violet-800 rounded-full text-xs font-medium">
                  {user.role}
                </span>
              </td>
              <td className="py-3 text-gray-500 text-sm">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3 text-right">
                {user.role !== "OWNER" && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to remove ${user.name}? This cannot be undone.`
                        )
                      ) {
                        const form = document.createElement("form");
                        form.method = "POST";
                        form.action = "/settings/staff/actions/delete";

                        const input = document.createElement("input");
                        input.type = "hidden";
                        input.name = "id";
                        input.value = user.id;

                        form.appendChild(input);
                        document.body.appendChild(form);
                        form.submit();
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
