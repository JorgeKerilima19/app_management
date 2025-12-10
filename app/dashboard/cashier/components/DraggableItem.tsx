// app/dashboard/cashier/components/DraggableItem.tsx
'use client';

interface Item {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function DraggableItem({ item }: { item: Item }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('itemId', item.id.toString());
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="p-3 border border-gray-200 rounded bg-gray-50 cursor-move hover:bg-gray-100"
    >
      <div className="font-medium">{item.quantity}x {item.name}</div>
      <div className="text-sm text-gray-600">S/ {item.price.toFixed(2)} each</div>
    </div>
  );
}