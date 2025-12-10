// app/dashboard/cashier/charge/[tableId]/page.tsx
'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Mock order items
const mockOrderItems = [
  { id: 1, name: 'Classic Burger', price: 25.9, quantity: 2 },
  { id: 2, name: 'Coca-Cola', price: 4.5, quantity: 2 },
  { id: 3, name: 'Caesar Salad', price: 18.5, quantity: 1 },
];

export default function ChargePage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const router = useRouter();

  // Mock: Table 2 has 6 seats, others have 4
  const capacity = tableId === '2' ? 6 : 4;
  const total = mockOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Split mode state
  const [paymentMode, setPaymentMode] = useState<'FULL' | 'SPLIT'>('FULL');
  const [assignments, setAssignments] = useState<Record<number, number[]>>(
    Array.from({ length: capacity }, (_, i) => [i + 1, []])
      .reduce((acc, [seat]) => ({ ...acc, [seat]: [] }), {})
  );

  // Payment inputs
  const [cash, setCash] = useState('');
  const [yape, setYape] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Validate payment
  useEffect(() => {
    if (!cash && !yape) {
      setError('');
      return;
    }
    const cashNum = parseFloat(cash) || 0;
    const yapeNum = parseFloat(yape) || 0;
    const paid = cashNum + yapeNum;

    if (Math.abs(paid - total) > 0.01) {
      setError(`Total paid (S/ ${paid.toFixed(2)}) must equal bill (S/ ${total.toFixed(2)})`);
    } else {
      setError('');
    }
  }, [cash, yape, total]);

  const totalPerSeat = (seat: number) => {
    return assignments[seat].reduce((sum, itemId) => {
      const item = mockOrderItems.find(i => i.id === itemId);
      return sum + (item ? item.price : 0);
    }, 0);
  };

  const handleDrop = (seatNumber: number, itemId: number) => {
    setAssignments(prev => ({
      ...prev,
      [seatNumber]: [...prev[seatNumber], itemId]
    }));
  };

  const isPaymentValid = () => {
    const cashNum = parseFloat(cash) || 0;
    const yapeNum = parseFloat(yape) || 0;
    return Math.abs(cashNum + yapeNum - total) < 0.01;
  };

  const handleProcessPayment = () => {
    if (isPaymentValid()) {
      setShowModal(true);
    }
  };

  const confirmPayment = () => {
    alert('✅ Payment processed successfully!');
    router.push('/dashboard/cashier');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Charge — Table {tableId}</h1>
        <button onClick={() => router.back()} className="text-violet-500 hover:text-violet-700">
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-3">Order Items</h2>
          <div className="space-y-2">
            {mockOrderItems.map(item => (
              <DraggableItem key={item.id} item={item} />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 font-bold">
            Total: S/ {total.toFixed(2)}
          </div>
        </div>

        {/* Split View (only in SPLIT mode) */}
        {paymentMode === 'SPLIT' && (
          <div className="lg:col-span-2">
            <h2 className="font-semibold mb-4">Split by Seat</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: capacity }).map((_, i) => {
                const seat = i + 1;
                return (
                  <PersonSpot
                    key={seat}
                    seatNumber={seat}
                    total={totalPerSeat(seat)}
                    onDrop={(itemId) => handleDrop(seat, itemId)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Payment Inputs */}
      <div className="mt-6 p-4 bg-white rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cash (S/)</label>
            <input
              type="number"
              step="0.01"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Yape (S/)</label>
            <input
              type="number"
              step="0.01"
              value={yape}
              onChange={(e) => setYape(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0.00"
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2 sm:mt-0">{error}</p>}
        </div>

        <div className="mt-4 flex justify-between items-center">
          {/* Toggle Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMode('FULL')}
              className={`px-3 py-1 text-sm rounded ${
                paymentMode === 'FULL' ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Pay Full Bill
            </button>
            <button
              onClick={() => setPaymentMode('SPLIT')}
              className={`px-3 py-1 text-sm rounded ${
                paymentMode === 'SPLIT' ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Split Bill
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={!isPaymentValid()}
              className={`px-4 py-2 rounded ${
                isPaymentValid()
                  ? 'bg-violet-500 hover:bg-violet-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {paymentMode === 'FULL' ? 'Pay Full Bill' : 'Process Payment'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Payment</h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Bill Total:</span>
                <span className="font-bold text-violet-600">S/ {total.toFixed(2)}</span>
              </div>
              {cash && (
                <div className="flex justify-between">
                  <span>Cash:</span>
                  <span>S/ {parseFloat(cash).toFixed(2)}</span>
                </div>
              )}
              {yape && (
                <div className="flex justify-between">
                  <span>Yape:</span>
                  <span>S/ {parseFloat(yape).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                className="flex-1 bg-violet-500 hover:bg-violet-600 text-white px-3 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Draggable Order Item
function DraggableItem({ item }: { item: { id: number; name: string; price: number; quantity: number } }) {
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

// Person Spot (Seat)
function PersonSpot({
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
    const itemId = Number(e.dataTransfer.getData('itemId'));
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