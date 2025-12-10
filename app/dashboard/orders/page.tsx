// app/dashboard/orders/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

type OrderStatus = 'PENDING' | 'SERVED' | 'CLOSED';

interface MockOrder {
  id: number;
  table: string;
  items: number;
  status: OrderStatus;
  total: number;
  time: string;
}

const mockOrders: MockOrder[] = [
  { id: 105, table: 'Table 3', items: 3, status: 'PENDING', total: 68.30, time: '10:24 AM' },
  { id: 104, table: 'Table 7', items: 5, status: 'SERVED', total: 124.50, time: '10:15 AM' },
  { id: 103, table: 'Table 2', items: 2, status: 'CLOSED', total: 45.80, time: '9:55 AM' },
  { id: 102, table: 'Table 5', items: 4, status: 'SERVED', total: 92.00, time: '9:40 AM' },
  { id: 101, table: 'Table 1', items: 1, status: 'CLOSED', total: 25.90, time: '9:20 AM' },
];

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 text-amber-800';
    case 'SERVED': return 'bg-green-100 text-green-800';
    case 'CLOSED': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  const filtered = mockOrders.filter(order => {
    const matchesSearch = order.table.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Active Orders</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SERVED">Served</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Order #{order.id}</div>
                    <div className="text-gray-600 text-sm">{order.table} • {order.items} items • {order.time}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <div className="font-bold text-gray-800">S/ {order.total.toFixed(2)}</div>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-violet-500 hover:text-violet-700 text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}