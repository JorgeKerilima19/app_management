// app/dashboard/page.tsx
export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Active Tables</h3>
          <p className="text-3xl font-bold text-violet-600 mt-2">12</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Open Orders</h3>
          <p className="text-3xl font-bold text-violet-600 mt-2">8</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Today Sales</h3>
          <p className="text-3xl font-bold text-violet-600 mt-2">S/ 1,240</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Low Stock</h3>
          <p className="text-3xl font-bold text-violet-600 mt-2">3</p>
        </div>
      </div>
    </div>
  );
}