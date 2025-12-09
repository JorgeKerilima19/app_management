// app/dashboard/tables/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TableCard, { RestaurantTable } from './TableCard';

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tables', { credentials: 'include' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch tables');
      const data = await res.json();
      // Enforce capacity 4 or 6 (in case DB has others)
      setTables(data.filter((t: any) => t.capacity === 4 || t.capacity === 6));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMergeMode = () => {
    setIsMergeMode(!isMergeMode);
    setSelectedTables([]);
  };

  const handleMerge = async () => {
    if (selectedTables.length < 2) return;

    try {
      const res = await fetch('/api/tables/merge', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableIds: selectedTables }),
      });

      if (res.ok) {
        setSelectedTables([]);
        setIsMergeMode(false);
        fetchTables();
      } else {
        const err = await res.json();
        setError(err.error);
      }
    } catch (err: any) {
      setError('Merge failed');
    }
  };

  if (loading) return <div className="p-6">Loading tables...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Table Management</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleMergeMode}
            className={`px-4 py-2 rounded-md ${
              isMergeMode
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-violet-500 hover:bg-violet-600 text-white'
            }`}
          >
            {isMergeMode ? 'Cancel Merge' : 'Merge Tables'}
          </button>
          <button
            onClick={() => router.push('/dashboard/tables/new')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
          >
            Add Table
          </button>
        </div>
      </div>

      {isMergeMode && selectedTables.length >= 2 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleMerge}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
          >
            Merge {selectedTables.length} Tables
          </button>
        </div>
      )}

      {/* Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            isSelected={selectedTables.includes(table.id)}
            onToggleSelect={() => {
              setSelectedTables(prev => 
                prev.includes(table.id)
                  ? prev.filter(id => id !== table.id)
                  : [...prev, table.id]
              );
            }}
            isMergeMode={isMergeMode}
          />
        ))}
      </div>
    </div>
  );
}