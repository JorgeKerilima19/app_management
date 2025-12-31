// app/(auth)/cashier/CustomerBillPrint.tsx
"use client";

import { format } from "date-fns";

export function CustomerBillPrint({
  restaurantName = "Bistro Del Sol",
  tableNumber,
  orders,
  total,
}: {
  restaurantName?: string;
  tableNumber: number;
  orders: {
    orderedBy?: { name: string } | null;
    items: {
      menuItem: {
        name: string;
        category?: { name: string } | null;
      };
      quantity: number;
      priceAtOrder: number;
    }[];
  }[];
  total: number;
}) {
  const allItems = orders.flatMap((order) => order.items);

  const categorized = allItems.reduce((acc, item) => {
    const categoryName = item.menuItem.category?.name?.trim() || "Otros";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, typeof allItems>);

  const sortedCategories = Object.keys(categorized).sort((a, b) => {
    if (a === "Otros") return 1;
    if (b === "Otros") return -1;
    return a.localeCompare(b);
  });

  const waiterName =
    orders.map((order) => order.orderedBy?.name).find((name) => name != null) ||
    "Staff";

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        width: "80mm",
        padding: "8px 6px",
        fontSize: "12px",
        lineHeight: 1.3,
        color: "#000",
        margin: "0 auto",
      }}
    >
      {/* Restaurant Header */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <div style={{ fontSize: "20px", marginBottom: "2px" }}>🍽️</div>
        <h1 style={{ fontWeight: "bold", fontSize: "16px", margin: "0 0 2px" }}>
          {restaurantName}
        </h1>
        <p style={{ fontSize: "10px", color: "#555", margin: "0" }}>
          123 Main Street • (555) 123-4567
        </p>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px dashed #000",
          margin: "4px 0",
        }}
      />

      {/* Table Info */}
      <div style={{ fontSize: "11px", marginBottom: "6px", lineHeight: 1.4 }}>
        <div>
          <strong>Mesa:</strong> {tableNumber}
        </div>
        <div>
          <strong>Atendido por:</strong> {waiterName}
        </div>
        <div>
          <strong>Fecha:</strong> {format(new Date(), "MMM d HH:mm")}
        </div>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px dashed #000",
          margin: "4px 0",
        }}
      />

      {/* Items */}
      {sortedCategories.map((categoryName) => (
        <div key={categoryName} style={{ marginBottom: "5px" }}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "10px",
              marginTop: "4px",
              textTransform: "uppercase",
              color: "#333",
            }}
          >
            {categoryName}
          </div>
          {categorized[categoryName].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2px",
                fontSize: "11px",
              }}
            >
              <div style={{ maxWidth: "60%", overflow: "hidden" }}>
                <span>{item.quantity}x</span> {item.menuItem.name}
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <div style={{ fontWeight: "bold" }}>
                  S/ {(item.priceAtOrder * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      <hr
        style={{
          border: "none",
          borderTop: "1px dashed #000",
          margin: "6px 0",
        }}
      />

      {/* Total */}
      <div
        style={{
          textAlign: "right",
          fontWeight: "bold",
          fontSize: "14px",
          marginBottom: "6px",
        }}
      >
        Total: S/ {total.toFixed(2)}
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          fontSize: "9px",
          color: "#777",
          marginTop: "4px",
        }}
      >
        ¡Gracias por su visita!
      </div>
    </div>
  );
}
