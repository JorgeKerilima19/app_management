// app/(dashboard)/cashier/CashierClientWrapper.tsx
"use client";

import { useState } from "react";
import { TableMap } from "./components/TableMap";
import { BillingPanel } from "./components/BillingPanel";

export function CashierClientWrapper({ tables }: { tables: any[] }) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 p-4 overflow-auto">
        <h1 className="text-2xl font-bold text-emerald-700 mb-6 text-center">
          Cashier Dashboard
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
