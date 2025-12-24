// app/(dashboard)/billing/BillingClientWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import { TableMap } from "./components/TableMap";
import { BillingPanel } from "./components/BillingPanel";
import { fetchTables } from "./actions";

export function BillingClientWrapper({
  tables: initialTables,
}: {
  tables: any[];
}) {
  const [tables, setTables] = useState(initialTables);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const freshTables = await fetchTables();
        setTables(freshTables);
      } catch (error) {
        console.error("Failed to refresh tables:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 p-4 overflow-auto">
        <h1 className="text-2xl font-bold text-emerald-700 mb-6 text-center">
          Vista Cajero
        </h1>
        <TableMap
          tables={tables}
          onTableSelect={setSelectedTableId}
          selectedTableId={selectedTableId}
        />
      </div>
      <BillingPanel
        tables={tables}
        selectedTableId={selectedTableId}
        onDismiss={() => setSelectedTableId(null)}
      />
    </div>
  );
}
