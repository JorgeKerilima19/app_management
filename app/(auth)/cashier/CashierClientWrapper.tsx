// app/(auth)/cashier/CashierClientWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import { TableMap } from "./TableMap";
import { BillingPanel } from "./components/BillingPanel";
import { fetchAllTables } from "./actions"; // Changed name to be more specific

export function CashierClientWrapper({
  tables: initialTables, // This prop might be unused now if fetching in the client wrapper
}: {
  tables: any[]; // Type this appropriately
}) {
  const [tables, setTables] = useState(initialTables); // Start with initial data if passed
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Fetch ALL tables, not just occupied ones
        const freshTables = await fetchAllTables();
        setTables(freshTables);
      } catch (error) {
        console.error("Failed to refresh tables:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-white">
      <div className="flex-1 p-4 overflow-auto">
        <h1 className="text-2xl font-bold text-violet-600 mb-6 text-center">
          Vista Cajero
        </h1>
        <TableMap
          tables={tables} // Pass all tables
          onTableSelect={setSelectedTableId}
          selectedTableId={selectedTableId}
        />
      </div>
      <BillingPanel
        tables={tables} // Pass all tables here too, BillingPanel will filter for occupied
        selectedTableId={selectedTableId}
        onDismiss={() => setSelectedTableId(null)}
      />
    </div>
  );
}
