// app/(dashboard)/tables/[id]/CustomerBillPrint.tsx
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
  // ✅ Flatten all items
  const allItems = orders.flatMap((order) => order.items);

  // ✅ Group by category, with "Other" for missing categories
  const categorized = allItems.reduce((acc, item) => {
    const categoryName = item.menuItem.category?.name?.trim() || "Other";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, typeof allItems>);

  // ✅ Sort categories (put "Other" last)
  const sortedCategories = Object.keys(categorized).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        width: "80mm",
        padding: "10px",
        fontSize: "13px",
        lineHeight: 1.4,
        color: "#000",
        margin: "0 auto",
      }}
    >
      {/* Restaurant Header */}
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "24px", marginBottom: "4px" }}>🍽️</div>
        <h1 style={{ fontWeight: "bold", fontSize: "18px", margin: "0 0 4px" }}>
          {restaurantName}
        </h1>
        <p style={{ fontSize: "11px", color: "#555", margin: "0" }}>
          123 Main Street • (555) 123-4567
        </p>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px dashed #000",
          margin: "6px 0",
        }}
      />

      <div style={{ fontSize: "12px", marginBottom: "8px" }}>
        <div>
          <strong>Table:</strong> {tableNumber}
        </div>
        <div>
          <strong>Date:</strong> {format(new Date(), "MMM d, yyyy 'at' HH:mm")}
        </div>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px dashed #000",
          margin: "6px 0",
        }}
      />

      {/* ✅ Grouped by category */}
      {sortedCategories.map((categoryName) => (
        <div key={categoryName} style={{ marginBottom: "8px" }}>
          <div
            style={{
              fontWeight: "bold",
              marginTop: "6px",
              textTransform: "uppercase",
              fontSize: "11px",
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
                marginBottom: "3px",
              }}
            >
              <div style={{ maxWidth: "60%" }}>
                <span>{item.quantity}x</span> {item.menuItem.name}
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <div>
                  ${item.priceAtOrder.toFixed(2)} × {item.quantity}
                </div>
                <div style={{ fontWeight: "bold" }}>
                  ${(item.priceAtOrder * item.quantity).toFixed(2)}
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
          margin: "10px 0",
        }}
      />

      <div style={{ textAlign: "right", fontWeight: "bold", fontSize: "16px" }}>
        Total: ${total.toFixed(2)}
      </div>

      <div
        style={{
          marginTop: "12px",
          textAlign: "center",
          fontSize: "10px",
          color: "#777",
        }}
      >
        Thank you for dining with us!
      </div>
    </div>
  );
}
