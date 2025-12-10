// app/dashboard/tables/[id]/components/TableHeader.tsx
export default function TableHeader({
  table,
  onBack,
}: {
  table: { name: string; capacity: number; status: string };
  onBack: () => void;
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{table.name}</h1>
        <p className="text-gray-600">
          {table.capacity} seats • <span className="font-medium">{table.status}</span>
        </p>
      </div>
      <button
        onClick={onBack}
        className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← Back to Tables
      </button>
    </div>
  );
}