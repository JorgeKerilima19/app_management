// app/dashboard/cashier/components/PersonSpot.tsx
"use client";

export default function PersonSpot({
  seatNumber,
  total,
  onDrop,
}: {
  seatNumber: number;
  total: number;
  onDrop: (itemId: number) => void;
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = Number(e.dataTransfer.getData("itemId"));
    onDrop(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-violet-400 transition-colors"
    >
      <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-2">
        <span className="font-bold text-violet-800">{seatNumber}</span>
      </div>
      <div className="font-medium">Seat {seatNumber}</div>
      <div className="text-sm text-gray-600 mt-1">S/ {total.toFixed(2)}</div>
    </div>
  );
}
