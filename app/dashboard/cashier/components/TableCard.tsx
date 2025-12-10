// app/dashboard/cashier/components/TableCard.tsx
'use client';

import Link from 'next/link';

type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'DIRTY';

interface Table {
  id: number;
  name: string;
  capacity: 4 | 6;
  status: TableStatus;
  hasOrder: boolean;
}

export default function TableCard({
  table,
  isSelected,
  isMerging,
  onSelect,
}: {
  table: Table;
  isSelected: boolean;
  isMerging: boolean;
  onSelect: (id: number) => void;
}) {
  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 border-green-500';
      case 'OCCUPIED': return 'bg-violet-100 border-violet-500';
      case 'DIRTY': return 'bg-gray-100 border-gray-500';
      default: return 'bg-white border-gray-300';
    }
  };

  const shapeClass = table.capacity === 4 ? 'aspect-square' : 'aspect-[2/1]';

  const handleClick = () => {
    if (isMerging) {
      onSelect(table.id);
    } else if (table.hasOrder) {
      // Go to charge page
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        border-2 rounded-lg p-3 text-center cursor-pointer transition-all relative
        ${getStatusColor(table.status)}
        ${shapeClass}
        ${isMerging ? 'hover:ring-2 hover:ring-violet-400' : ''}
        ${isSelected ? 'ring-2 ring-violet-500 ring-offset-2' : ''}
        ${!isMerging && table.hasOrder ? 'hover:bg-violet-200' : ''}
      `}
    >
      <div className="font-bold text-sm">{table.name}</div>
      <div className="text-xs opacity-75 mt-1">{table.capacity} seats</div>
      <div className="text-xs font-medium mt-1">{table.status}</div>

      {!isMerging && table.hasOrder && (
        <Link
          href={`/dashboard/cashier/charge/${table.id}`}
          className="absolute inset-0"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}