// app/(dashboard)/settings/staff/_components.tsx
"use client";

import { addStaffAction, removeStaffAction } from "./actions";
import { useState } from "react";

export function AddStaffForm() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-violet-500 text-white px-4 py-2 rounded hover:bg-violet-600 mb-6"
      >
        + Add New Staff
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Staff Member</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form action={addStaffAction} className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <select
                name="role"
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">Select Role</option>
                <option value="WAITER">Waiter</option>
                <option value="CHEF">Chef</option>
                <option value="CASHIER">Cashier</option>
                <option value="MANAGER">Manager</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
                >
                  Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function StaffList({ staff }: { staff: any[] }) {
  return (
    <div className="overflow-x-auto">
      {staff.length === 0 ? (
        <p className="text-gray-500">No staff members yet.</p>
      ) : (
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Role</th>
              <th className="border p-2 text-left">Added</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="border p-2">{user.name}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-800 rounded text-sm">
                    {user.role}
                  </span>
                </td>
                <td className="border p-2 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="border p-2">
                  {user.role !== "OWNER" && (
                    <form
                      action={removeStaffAction}
                      onSubmit={(e) => {
                        if (!confirm(`Remove ${user.name} (${user.role})?`)) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="id" value={user.id} />
                      <button
                        type="submit"
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
