// app/dashboard/tables/[id]/page.tsx
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';

type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'DIRTY';

export default function TableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tableId = Number(id);
  const router = useRouter();

  // 🔥 VALIDATE tableId — critical for navigation
  if (isNaN(tableId) || tableId <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Invalid table ID</p>
      </div>
    );
  }

  // 🔥 MOCK TABLE DATA
  const table = {
    id: tableId,
    name: `Table ${tableId}`,
    capacity: tableId % 2 === 0 ? 4 : 6,
    status: 'OCCUPIED' as TableStatus,
  };

  // 🔥 MOCK ORDER DATA (always show for demo)
  const mockOrder = {
    id: 100 + tableId,
    status: 'OPEN',
    orderItems: [
      { id: 1, menuItem: { name: 'Classic Burger', price: 25.9 }, quantity: 2, status: 'PENDING' },
      { id: 2, menuItem: { name: 'Coca-Cola', price: 4.5 }, quantity: 2, status: 'SERVED' },
      { id: 3, menuItem: { name: 'Caesar Salad', price: 18.5 }, quantity: 1, status: 'CANCELLED' },
    ],
  };

  const handleAddMore = () => {
    // ✅ SAFE NAVIGATION — tableId is guaranteed valid number
    router.push(`/dashboard/tables/${tableId}/add-order`);
  };

  const total = mockOrder.orderItems
    .filter(item => item.status !== 'CANCELLED')
    .reduce((sum, item) => sum + item.quantity * item.menuItem.price, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{table.name}</h1>
            <p className="text-gray-600">
              {table.capacity} seats • <span className="font-medium">{table.status}</span>
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            ← Back to Tables
          </button>
        </div>

        {/* Active Order Card (mock) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Active Order</h2>
              <span className="px-3 py-1 bg-violet-100 text-violet-800 text-sm font-medium rounded-full">
                LIVE
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {mockOrder.orderItems.map((item) => {
                const isCancelled = item.status === 'CANCELLED';
                const isServed = item.status === 'SERVED';
                const isPending = item.status === 'PENDING';

                return (
                  <div
                    key={item.id}
                    className={`flex justify-between items-center py-2 border-b border-gray-100 last:border-0 ${
                      isCancelled ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                          Pending
                        </span>
                      )}
                      {isServed && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Served
                        </span>
                      )}
                      <span className={isCancelled ? 'line-through text-red-500' : 'text-gray-800'}>
                        {item.quantity}x {item.menuItem.name}
                      </span>
                    </div>
                    <span className="font-medium text-gray-800">
                      S/ {(item.quantity * item.menuItem.price).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <span className="font-bold text-lg">Total:</span>
                <span className="ml-2 font-bold text-violet-600">S/ {total.toFixed(2)}</span>
              </div>
              <button
                onClick={handleAddMore}
                className="text-sm bg-violet-500 hover:bg-violet-600 text-white px-3 py-1.5 rounded"
              >
                Add More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}