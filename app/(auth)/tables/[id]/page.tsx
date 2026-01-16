// app/(auth)/tables/[id]/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { openTableAction } from "./actions";
import { TableOrderManager } from "./TableOrderManager";

function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return parseFloat(value.toString());
}

export default async function TablePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user || !["MESERO", "CAJERO", "OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const table = await prisma.table.findUnique({
    where: { id, deletedAt: null },
    include: {
      currentCheck: {
        include: {
          orders: {
            include: {
              items: {
                include: {
                  menuItem: {
                    include: { category: true },
                  },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!table) {
    return (
      <div className="p-8 text-center bg-white min-h-screen">
        <p className="text-red-500">Mesa no encontrada.</p>
        <Link
          href="/tables"
          className="text-violet-600 mt-4 inline-block hover:underline"
        >
          ← Regresar a Mesas
        </Link>
      </div>
    );
  }

  let serializedMenuItems: any[] = [];
  if (table.status === "OCCUPIED") {
    const menuItems = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: { category: true },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });
    serializedMenuItems = menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: toNumber(item.price),
      isAvailable: item.isAvailable,
      prepTimeMin: item.prepTimeMin,
      categoryId: item.categoryId,
      category: { name: item.category.name },
      station: item.station, // ✅ Include station
    }));
  }

  let serializedCheck = null;
  if (table.currentCheck) {
    serializedCheck = {
      ...table.currentCheck,
      subtotal: toNumber(table.currentCheck.subtotal),
      tax: toNumber(table.currentCheck.tax),
      discount: toNumber(table.currentCheck.discount),
      total: toNumber(table.currentCheck.total),
      orders: table.currentCheck.orders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          priceAtOrder: toNumber(item.priceAtOrder),
          menuItem: {
            ...item.menuItem,
            price: toNumber(item.menuItem.price),
          },
        })),
      })),
    };
  }

  if (table.status === "AVAILABLE") {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 bg-white min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-violet-500">
            Mesa {table.number}
          </h1>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Disponible
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-700 mb-6 text-lg">
            Abre la mesa cuando el cliente esté listo para ordenar
          </p>
          <form action={openTableAction}>
            <input type="hidden" name="tableId" value={table.id} />
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg"
            >
              Abrir Mesa
            </button>
          </form>
        </div>
        <div className="mt-8 text-center">
          <Link href="/tables" className="text-violet-600 hover:underline">
            ← Regresar a Mesas
          </Link>
        </div>
      </div>
    );
  }

  if (table.status !== "OCCUPIED" || !serializedCheck) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 bg-white min-h-screen">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 text-lg">
            Mesa está <strong>{table.status.toLowerCase()}</strong>. Por favor
            límpiala antes de reusar.
          </p>
        </div>
        <div className="mt-8 text-center">
          <Link href="/tables" className="text-violet-600 hover:underline">
            ← Regresar a Mesas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-violet-500">
          Mesa {table.number}
        </h1>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Ocupado
        </span>
      </div>

      <TableOrderManager
        tableId={table.id}
        tableNumber={table.number}
        currentCheck={serializedCheck}
        menuItems={serializedMenuItems}
      />

      <div className="mt-8 text-center">
        <Link href="/tables" className="text-violet-600 hover:underline">
          ← Regresar a mesas
        </Link>
      </div>
    </div>
  );
}
