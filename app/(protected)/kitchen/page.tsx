import RequireAuth from "@/components/RequireAuth";
import Sidebar from "@/components/navbar/Sidebar";

export default function KitchenPage() {
  return (
    <RequireAuth>
      <Sidebar />
      <div className="ml-64 p-6">
        <h1 className="text-2xl font-semibold">Kitchen</h1>
        <p>Tables with pending orders will appear here.</p>
      </div>
    </RequireAuth>
  );
}
