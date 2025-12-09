// app/dashboard/tables/[id]/page.tsx
'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'DIRTY';

interface MenuItem {
  id: number;
  name: string;
  price: number;
}

interface OrderItem {
  id: number;
  quantity: number;
  menuItem: MenuItem;
}

interface Order {
  id: number;
  status: string;
  orderItems: OrderItem[];
}

interface RestaurantTable {
  id: number;
  name: string;
  capacity: number;
  status: TableStatus;
  groupId: number | null;
}

export default function TableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // ✅ safely unwrap dynamic param

  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [openOrder, setOpenOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch table
        const tableRes = await fetch(`/api/tables/${id}`, { credentials: 'include' });
        if (tableRes.status === 401) {
          router.push('/login');
          return;
        }
        if (!tableRes.ok) throw new Error('Failed to load table');

        const tableData = await tableRes.json();
        setTable(tableData);

        // Fetch open order
        const orderRes = await fetch(`/api/tables/${id}/orders`, { credentials: 'include' });
        if (orderRes.ok) {
          const orders = await orderRes.json();
          const open = orders.find((o: Order) => o.status === 'OPEN');
          setOpenOrder(open || null);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">Error: {error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-violet-500 hover:text-violet-700"
        >
          ← Back to Tables
        </button>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="p-6">
        <p className="text-gray-700">Table not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-violet-500 hover:text-violet-700"
        >
          ← Back to Tables
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Table: {table.name}</h1>
      <p className="text-gray-600 mt-1">
        Capacity: {table.capacity} seats • Status: <span className="font-medium">{table.status}</span>
      </p>

      {openOrder ? (
        <div className="mt-6 p-4 border border-violet-200 bg-violet-50 rounded-lg">
          <h2 className="font-bold text-violet-800 text-lg">Open Order #{openOrder.id}</h2>
          <div className="mt-3 space-y-2">
            {openOrder.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between text-gray-700">
                <span>
                  {item.quantity}x {item.menuItem.name}
                </span>
                <span>S/ {(item.quantity * Number(item.menuItem.price)).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {/* Future: Add "Add Item", "Close", "Charge" buttons here */}
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-gray-600 mb-4">No open order for this table.</p>
          <form action={`/api/tables/${id}/orders`} method="POST">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
            >
              Open Table (Start New Order)
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => router.back()}
        className="mt-6 text-gray-600 hover:text-gray-900 flex items-center gap-1"
      >
        ← Back to Tables
      </button>
    </div>
  );
}