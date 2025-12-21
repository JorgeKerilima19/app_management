// app/(dashboard)/settings/staff/StaffForm.tsx
"use client";

import { addStaffAction } from "./actions";
import { useState } from "react";

export default function StaffForm() {
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string | null;
  }>({
    type: null,
    message: null,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ type: null, message: null });

    const formData = new FormData(e.currentTarget);
    const result = await addStaffAction(formData);

    if (result?.error) {
      setStatus({ type: "error", message: result.error });
    } else if (result?.success) {
      setStatus({
        type: "success",
        message: "Staff member added successfully!",
      });
      e.currentTarget.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            required
          />
        </div>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            required
          />
        </div>
        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            required
            minLength={6}
          />
        </div>
        <div className="flex gap-2">
          <select
            name="role"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            required
          >
            <option value="">Select Role</option>
            <option value="WAITER">Waiter</option>
            <option value="CHEF">Chef</option>
            <option value="CASHIER">Cashier</option>
            <option value="MANAGER">Manager</option>
          </select>
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-lg whitespace-nowrap font-medium transition"
          >
            Add
          </button>
        </div>
      </div>

      {status.message && (
        <div
          className={`p-3 rounded-lg ${
            status.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status.message}
        </div>
      )}
    </form>
  );
}
