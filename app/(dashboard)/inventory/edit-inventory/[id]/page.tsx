// app/(dashboard)/inventory/edit-inventory/[id]/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";
import { updateInventoryItem } from "../actions";

// ✅ Make the component async and await params
export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>; // ✅ params is a Promise in Next.js 15+
}) {
  // ✅ Await params to get the actual object
  const { id } = await params;

  const item = await prisma.inventoryItem.findUnique({
    where: { id }, // ✅ Now id is a string
  });

  if (!item) {
    return (
      <div className="p-8">
        <p className="text-red-500">Item not found.</p>
        <Link href="/inventory" className="text-violet-600 mt-4 inline-block">
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-violet-600">Edit Item</h1>
        <Link
          href="/inventory"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Inventory
        </Link>
      </div>

      <form action={updateInventoryItem} className="space-y-4">
        <input type="hidden" name="id" value={item.id} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            name="name"
            defaultValue={item.name}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              step="0.01"
              defaultValue={item.quantity}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <input
              type="text"
              name="unit"
              defaultValue={item.unit}
              className="w-full px-3 py-2 border rounded-lg"
              required
              placeholder="kg, pcs, L..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category (optional)
          </label>
          <input
            type="text"
            name="category"
            defaultValue={item.category || ""}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="e.g., Produce, Dairy"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            name="notes"
            defaultValue={item.notes || ""}
            className="w-full px-3 py-2 border rounded-lg"
            rows={2}
            placeholder="e.g., Organic, Local vendor"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/inventory"
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
