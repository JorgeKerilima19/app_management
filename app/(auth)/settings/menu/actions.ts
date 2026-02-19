// app/settings/menu/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function toNumber(value: any): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return parseFloat(value.toString());
}

// === CATEGORIES ===

export async function createCategory(_: any, formData: FormData) {
  const name = formData.get("name")?.toString();
  const isActive = formData.get("isActive") === "on";

  if (!name?.trim()) {
    return { error: "El nombre es requerido" };
  }

  try {
    await prisma.category.create({
      data: {
        name: name.trim(),
        isActive: isActive ?? true,
        displayOrder: 0,
      },
    });
    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    return { error: "Error al crear la categoría" };
  }
}

export async function updateCategory(_: any, formData: FormData) {
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString();
  const isActive = formData.get("isActive") === "on";

  if (!id || !name?.trim()) {
    return { error: "Datos inválidos" };
  }

  try {
    // ✅ Use transaction for safety
    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id },
        data: { name: name.trim(), isActive: isActive ?? true },
      });

      if (isActive === false) {
        await tx.menuItem.updateMany({
          where: { categoryId: id },
          data: { isAvailable: false },
        });
      }
    });

    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    console.error("Update category error:", error);
    return { error: "Error al actualizar la categoría" };
  }
}

export async function deleteCategory(_: any, formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  try {
    // ✅ Check if category has ANY menu items (even inactive)
    const menuItemCount = await prisma.menuItem.count({
      where: { categoryId: id },
    });

    if (menuItemCount > 0) {
      return { error: "No se puede eliminar. Solo desactívala." };
    }

    await prisma.category.delete({ where: { id } });
    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    console.error("Delete category error:", error);
    return { error: "Error al eliminar la categoría" };
  }
}

// === MENU ITEMS ===

export async function createMenuItem(_: any, formData: FormData) {
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const priceStr = formData.get("price")?.toString();
  const categoryId = formData.get("categoryId")?.toString();
  const isAvailable = formData.get("isAvailable") === "on";
  const prepTimeMinStr = formData.get("prepTimeMin")?.toString();
  const station = formData.get("station")?.toString();

  if (!name?.trim()) return { error: "Nombre es requerido" };
  if (!categoryId) return { error: "Seleccione una categoría" };
  if (!priceStr) return { error: "Precio es requerido" };
  if (!station || !["KITCHEN", "BAR"].includes(station)) {
    return { error: "Estación de preparación es requerida" };
  }

  const price = parseFloat(priceStr);
  if (isNaN(price) || price <= 0) return { error: "Precio inválido" };

  const prepTimeMin = prepTimeMinStr ? parseInt(prepTimeMinStr, 10) : null;
  if (prepTimeMin !== null && (isNaN(prepTimeMin) || prepTimeMin < 0)) {
    return { error: "Tiempo de preparación inválido" };
  }

  try {
    await prisma.menuItem.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: price, // ✅ Number, not Decimal
        isAvailable: isAvailable ?? true,
        prepTimeMin: prepTimeMin || undefined,
        categoryId,
        station: station as "KITCHEN" | "BAR",
      },
    });
    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    console.error("Create item error:", error);
    return { error: "Error al crear el item" };
  }
}

export async function updateMenuItem(_: any, formData: FormData) {
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const priceStr = formData.get("price")?.toString();
  const isAvailable = formData.get("isAvailable") === "on";
  const prepTimeMinStr = formData.get("prepTimeMin")?.toString();
  const station = formData.get("station")?.toString();
  const categoryId = formData.get("categoryId")?.toString(); // ← MISSING!

  if (!id || !name?.trim()) return { error: "Datos inválidos" };
  if (!priceStr) return { error: "Precio es requerido" };
  if (!station || !["KITCHEN", "BAR"].includes(station)) {
    return { error: "Estación de preparación es requerida" };
  }
  if (!categoryId) return { error: "Categoría es requerida" }; // ← MISSING!

  const price = parseFloat(priceStr);
  if (isNaN(price) || price <= 0) return { error: "Precio inválido" };

  const prepTimeMin = prepTimeMinStr ? parseInt(prepTimeMinStr, 10) : null;
  if (prepTimeMin !== null && (isNaN(prepTimeMin) || prepTimeMin < 0)) {
    return { error: "Tiempo de preparación inválido" };
  }

  try {
    await prisma.menuItem.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: price,
        isAvailable: isAvailable ?? true,
        prepTimeMin: prepTimeMin || undefined,
        station: station as "KITCHEN" | "BAR",
        categoryId,
      },
    });
    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    console.error("Update item error:", error);
    return { error: "Error al actualizar" };
  }
}

export async function deleteMenuItem(_: any, formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  try {
    const orderItemCount = await prisma.orderItem.count({
      where: { menuItemId: id },
    });

    if (orderItemCount > 0) {
      return { error: "No se puede eliminar. Solo desactívalo." };
    }

    await prisma.menuItem.delete({ where: { id } });
    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    console.error("Delete item error:", error);
    return { error: "Error al eliminar" };
  }
}

export async function saveRecipeItems(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const menuItemId = formData.get("menuItemId")?.toString();
  if (!menuItemId) throw new Error("MenuItem ID requerido");

  const recipeEntries: Array<{
    inventoryItemId: string;
    quantity: number;
    unit: string;
    note?: string;
  }> = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("ingredient-") && value) {
      const inventoryItemId = key.replace("ingredient-", "");
      const quantity = parseFloat(value as string);
      const unit = (formData.get(`unit-${inventoryItemId}`) as string) || "";
      const note =
        (formData.get(`note-${inventoryItemId}`) as string) || undefined;

      if (!isNaN(quantity) && quantity > 0) {
        recipeEntries.push({ inventoryItemId, quantity, unit, note });
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.recipeItem.deleteMany({ where: { menuItemId } });

    if (recipeEntries.length > 0) {
      await tx.recipeItem.createMany({
        data: recipeEntries.map(
          ({ inventoryItemId, quantity, unit, note }) => ({
            menuItemId,
            inventoryItemId,
            quantityRequired: quantity,
            unit,
            note,
          }),
        ),
      });
    }
  });

  revalidatePath("/settings/menu");
  return { success: true };
}

export async function getRecipeItems(menuItemId: string) {
  return await prisma.recipeItem.findMany({
    where: { menuItemId },
    include: { inventoryItem: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateRecipeItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const menuItemId = formData.get("menuItemId")?.toString();
  const inventoryItemId = formData.get("inventoryItemId")?.toString();
  const quantityStr = formData.get("quantityRequired")?.toString();
  const note = formData.get("note")?.toString() || null;

  if (!menuItemId || !inventoryItemId || !quantityStr) {
    throw new Error("Datos incompletos");
  }

  const quantityRequired = parseFloat(quantityStr);
  if (isNaN(quantityRequired) || quantityRequired <= 0) {
    throw new Error("Cantidad inválida");
  }

  await prisma.recipeItem.update({
    where: {
      menuItemId_inventoryItemId: {
        menuItemId,
        inventoryItemId,
      },
    },
    data: {
      quantityRequired,
      note,
    },
  });

  revalidatePath("/settings/menu");
  return { success: true };
}

export async function deleteRecipeItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    throw new Error("No autorizado");
  }

  const menuItemId = formData.get("menuItemId")?.toString();
  const inventoryItemId = formData.get("inventoryItemId")?.toString();

  if (!menuItemId || !inventoryItemId) {
    throw new Error("Datos incompletos");
  }

  await prisma.recipeItem.delete({
    where: {
      menuItemId_inventoryItemId: {
        menuItemId,
        inventoryItemId,
      },
    },
  });

  revalidatePath("/settings/menu");
  return { success: true };
}
