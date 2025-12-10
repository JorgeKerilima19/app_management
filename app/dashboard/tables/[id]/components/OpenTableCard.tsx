// app/dashboard/tables/[id]/components/OpenTableCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OpenTableCard({ tableId }: { tableId: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleOpenTable = async () => {
    setLoading(true);
    try {
      // ✅ Only update table status — no order yet
      const res = await fetch("/api/tables/status", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, status: "OCCUPIED" }),
      });

      if (res.ok) {
        // Go to menu to build order
        router.push(`/dashboard/tables/${tableId}/add-order`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
      <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="h-8 w-8 text-violet-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Open Table</h2>
      <p className="text-gray-600 mb-6">Start a new order for this table.</p>
      <button
        onClick={handleOpenTable}
        disabled={loading}
        className="bg-violet-500 hover:bg-violet-600 text-white font-medium py-2.5 px-6 rounded-lg"
      >
        {loading ? "Opening..." : "Open Table"}
      </button>
    </div>
  );
}
