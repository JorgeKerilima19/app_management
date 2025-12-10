// app/dashboard/tables/[id]/add-order/page.tsx
'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MenuItem {
  id: number;
  name: string;
  price: number;
}

export default function AddOrderPage({ params }: { params: Promise<{ id: string }> }) {
  // ✅ 1. Unwrap params correctly
  const { id } = use(params);
  const tableId = Number(id);
  const router = useRouter();

  // ✅ 2. Validate tableId immediately
  if (isNaN(tableId) || tableId <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Invalid table ID</p>
      </div>
    );
  }

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // ✅ 3. Load menu (your API works — keep this)
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const items = await res.json();
          setMenuItems(items.map((i: any) => ({ ...i, price: Number(i.price) })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const addToCart = (menuItemId: number) => {
    setCart(prev => ({ ...prev, [menuItemId]: (prev[menuItemId] || 0) + 1 }));
  };

  const removeFromCart = (menuItemId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[menuItemId] > 1) {
        newCart[menuItemId]--;
      } else {
        delete newCart[menuItemId];
      }
      return newCart;
    });
  };

  // ✅ 4. Send order with VALID tableId
  const sendOrder = async () => {
    setSending(true);
    try {
      const orderItems = Object.entries(cart).map(([menuItemId, quantity]) => ({
        menuItemId: Number(menuItemId),
        quantity,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        // ✅ tableId is guaranteed to be a valid number here
        body: JSON.stringify({ tableId, orderItems }),
      });

      if (res.ok) {
        router.push(`/dashboard/tables/${tableId}`); // ✅ back to table detail
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to send order');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setSending(false);
    }
  };

  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find(m => m.id === Number(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  if (loading) {
    return <div className="p-6">Loading menu...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* ✅ FIXED: Shows real table ID */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Add Order — Table {tableId}</h1>
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Cancel
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Menu</h2>
            <div className="space-y-3">
              {menuItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">S/ {item.price.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => addToCart(item.id)}
                    className="bg-violet-500 hover:bg-violet-600 text-white w-8 h-8 rounded-full"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Order Preview</h2>
            {Object.keys(cart).length === 0 ? (
              <p className="text-gray-500">No items added yet.</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {Object.entries(cart).map(([menuItemId, quantity]) => {
                    const item = menuItems.find(m => m.id === Number(menuItemId));
                    if (!item) return null;
                    return (
                      <div key={menuItemId} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{quantity}x</span> {item.name}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => removeFromCart(Number(menuItemId))}
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded"
                          >
                            −
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>S/ {total.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={sendOrder}
                    disabled={sending}
                    className="mt-4 w-full bg-violet-500 hover:bg-violet-600 text-white py-2 rounded-lg"
                  >
                    {sending ? 'Sending...' : 'Send Order'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}