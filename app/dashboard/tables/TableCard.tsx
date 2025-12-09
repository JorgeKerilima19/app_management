// app/dashboard/tables/TableCard.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type TableStatus = "AVAILABLE" | "OCCUPIED" | "DIRTY";

export type RestaurantTable = {
  id: number;
  name: string;
  capacity: 4 | 6; // only 4 or 6 allowed
  status: TableStatus;
  groupId: number | null;
};

interface TableCardProps {
  table: RestaurantTable;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isMergeMode?: boolean; // if true, only OCCUPIED tables are selectable
}

export default function TableCard({
  table,
  isSelected = false,
  onToggleSelect,
  isMergeMode = false,
}: TableCardProps) {
  const router = useRouter();

  const isSelectable = isMergeMode
    ? table.status === "OCCUPIED"
    : table.status === "AVAILABLE";

  const handleClick = () => {
    if (isMergeMode && onToggleSelect) {
      if (isSelectable) {
        onToggleSelect();
      }
      return;
    }
    // Normal: go to table detail
    router.push(`/dashboard/tables/${table.id}`);
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 border-green-500 text-green-800";
      case "OCCUPIED":
        return "bg-violet-100 border-violet-500 text-violet-800";
      case "DIRTY":
        return "bg-gray-100 border-gray-500 text-gray-800";
      default:
        return "bg-white border-gray-300 text-gray-800";
    }
  };

  // Visual: square (4) vs rectangle (6)
  const shapeClass =
    table.capacity === 4
      ? "aspect-square" // 1:1 ratio
      : "aspect-[2/1]"; // 2:1 ratio (wider)

  return (
    <div
      onClick={handleClick}
      className={`
        border-2 rounded-lg p-3 text-center cursor-pointer transition-all
        ${getStatusColor(table.status)}
        ${shapeClass}
        ${
          isMergeMode && isSelectable
            ? "hover:ring-2 hover:ring-violet-400"
            : ""
        }
        ${
          isSelected && isSelectable
            ? "ring-2 ring-violet-500 ring-offset-2"
            : ""
        }
        ${!isSelectable && isMergeMode ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <div className="font-bold text-sm">{table.name}</div>
      <div className="text-xs opacity-75 mt-1">{table.capacity} seats</div>
      <div className="text-xs font-medium mt-1">{table.status}</div>
    </div>
  );
}
