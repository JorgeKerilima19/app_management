// Inside app/dashboard/bills/page.tsx
"use client"
import { useState } from "react";

export default function BillsPage() {
  // Generate date range: last 30 days (or more if needed)
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0]; // YYYY-MM-DD

  // Mock bills (keep your existing mock data)
  const mockBills = [
    { id: 205, date: formatDate(today), table: 'Table 3', amount: 68.30, status: 'PENDING' },
    // ... your other mock bills
  ];

  // Default to today
  const [selectedDate, setSelectedDate] = useState(formatDate(today));

  const filteredBills = mockBills.filter(bill => bill.date === selectedDate);
  const totalSales = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Sales & Bills</h1>
        
        {/* ✅ CALENDAR DATE PICKER */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md w-full max-w-[180px]"
          />
        </div>
      </div>

      {/* Rest of your UI: summary cards + bill list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-gray-600">Total Sales</div>
          <div className="text-2xl font-bold text-violet-600">S/ {totalSales.toFixed(2)}</div>
        </div>
        {/* ... other stats */}
      </div>

      {/* Bill list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredBills.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No bills for this date</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredBills.map((bill) => (
              <div key={bill.id} className="p-4 hover:bg-gray-50">
                {/* your bill row */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}