export default function KitchenBoard() {
  const mockOrders = [
    { table: "T1", items: 3, minutes: 12 },
    { table: "T3", items: 1, minutes: 4 },
    { table: "T5", items: 5, minutes: 18 },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold mb-4">Kitchen Board</h1>

      {mockOrders.map((o, i) => (
        <div
          key={i}
          className="p-4 border rounded-xl bg-white shadow flex justify-between"
        >
          <div>
            <p className="font-semibold">Table {o.table}</p>
            <p className="text-gray-500">{o.items} items</p>
          </div>
          <p className="text-lg font-bold">{o.minutes} min</p>
        </div>
      ))}
    </div>
  );
}
