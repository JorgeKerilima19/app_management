// app/(auth)/dashboard/close/CloseClient.tsx
"use client";

import { useState, useTransition } from "react";
import { closeRestaurant } from "./actions";
import { useRouter } from "next/navigation";
import {
  CloseButton,
  FinancialSummary,
  Header,
  InventoryChanges,
  ItemsSold,
  ManualAdjustments,
  StorageSpendings,
  VoidRecords,
} from "./components";
import { exportClosingReportToExcel } from "@/lib/excelExport";

type MenuItem = {
  price: any;
  id: string;
  name: string;
  category: { name: string } | null;
};

type StorageTransaction = {
  id: string;
  type: string;
  storageItemName: string;
  quantityChange: number;
  costPerUnit: number;
  subtotal: number;
  category: string;
  performedBy: string;
  createdAt: Date;
};

export type ClosingData = {
  dailySummary: {
    id: string;
    startingCash: number;
    endingCash: number;
    status: "OPEN" | "CLOSED";
  } | null;
  sales: {
    totalCash: number;
    totalYape: number;
    totalOverall: number;
  };
  spendings: {
    total: number;
    netProfit: number;
    marginPercent: number;
    items: StorageTransaction[];
  };
  itemsSold: {
    menuItem: MenuItem | null;
    totalQuantity: number;
    totalSales: number;
  }[];
  totalItems: number;
  inventoryChanges: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    category: string | null;
    notes: string | null;
    costPerUnit: number | null;
    updatedAt: Date;
    storage_transfer: number;
  }[];
  categories: { id: string; name: string }[];
  voidRecords: {
    id: string;
    voidedBy: { name: string } | null;
    target: string;
    targetDetails: string;
    totalVoided: number;
    reason: string;
    createdAt: Date;
  }[];
  manualAdjustments?: {
    id: string;
    createdAt: Date;
    inventoryItem: { name: string; category: string | null };
    type: string;
    quantityChange: number;
    reason: string;
    performedBy: { name: string } | null;
  }[];
  date: Date;
  currentPage: number;
  itemsPerPage: number;
};

export default function CloseClient({
  initialData,
}: {
  initialData: ClosingData;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleClose = () => {
    startTransition(async () => {
      try {
        await closeRestaurant();
        router.push("/dashboard");
      } catch (error) {
        console.error("Error closing restaurant:", error);
        alert("Error al cerrar el día");
      }
    });
  };

  const handleExport = () => {
    exportClosingReportToExcel(initialData);
  };

  return (
    <div className="space-y-8 p-4 max-w-6xl mx-auto">
      <Header
        date={initialData.date}
        onExport={handleExport}
        onBack={() => router.push("/dashboard")}
      />

      {initialData.dailySummary?.status === "OPEN" && (
        <CloseButton isPending={isPending} onClose={handleClose} />
      )}

      {initialData.dailySummary && (
        <FinancialSummary
          dailySummary={initialData.dailySummary}
          sales={initialData.sales}
          spendings={initialData.spendings}
        />
      )}

      {initialData.spendings.items.length > 0 && (
        <StorageSpendings items={initialData.spendings.items} />
      )}

      <ItemsSold
        items={initialData.itemsSold}
        totalItems={initialData.totalItems}
        categories={initialData.categories}
        currentPage={initialData.currentPage}
        itemsPerPage={initialData.itemsPerPage}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onPageChange={(page) => {
          const url = new URL(window.location.href);
          url.searchParams.set("page", page.toString());
          if (selectedCategory)
            url.searchParams.set("categoryId", selectedCategory);
          router.push(url.toString());
        }}
      />

      {initialData.inventoryChanges.length > 0 && (
        <InventoryChanges changes={initialData.inventoryChanges} />
      )}

      {initialData.voidRecords.length > 0 && (
        <VoidRecords records={initialData.voidRecords} />
      )}

      {/* Manual Adjustments Section */}
      {initialData.manualAdjustments &&
        initialData.manualAdjustments.length > 0 && (
          <ManualAdjustments adjustments={initialData.manualAdjustments} />
        )}
    </div>
  );
}
