export default function DashboardCards() {
  const mock = {
    revenueToday: 863.50,
    totalOrders: 42,
    averageTicket: 20.56,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 rounded-xl shadow bg-white border">
        <h3 className="text-gray-600 text-sm">Revenue Today</h3>
        <p className="text-3xl font-semibold">${mock.revenueToday}</p>
      </div>

      <div className="p-6 rounded-xl shadow bg-white border">
        <h3 className="text-gray-600 text-sm">Orders Today</h3>
        <p className="text-3xl font-semibold">{mock.totalOrders}</p>
      </div>

      <div className="p-6 rounded-xl shadow bg-white border">
        <h3 className="text-gray-600 text-sm">Avg Ticket</h3>
        <p className="text-3xl font-semibold">${mock.averageTicket}</p>
      </div>
    </div>
  );
}
