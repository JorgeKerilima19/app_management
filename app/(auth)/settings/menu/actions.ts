// app/settings/menu/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

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
    await prisma.category.update({
      where: { id },
      data: { name: name.trim(), isActive: isActive ?? true },
    });

    // If disabling category, disable all its menu items
    if (isActive === false) {
      await prisma.menuItem.updateMany({
        where: { categoryId: id },
        data: { isAvailable: false },
      });
    }

    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar" };
  }
}

export async function deleteCategory(_: any, formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  try {
    await prisma.$transaction([
      prisma.menuItem.deleteMany({ where: { categoryId: id } }),
      prisma.category.delete({ where: { id } }),
    ]);
    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    return { error: "Error al eliminar la categoría y sus items" };
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
        price: price,
        isAvailable: isAvailable ?? true,
        prepTimeMin: prepTimeMin || undefined,
        categoryId,
        station: station as "KITCHEN" | "BAR",
      },
    });
    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
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

  if (!id || !name?.trim()) return { error: "Datos inválidos" };
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
    await prisma.menuItem.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: price,
        isAvailable: isAvailable ?? true,
        prepTimeMin: prepTimeMin || undefined,
        station: station as "KITCHEN" | "BAR",
      },
    });
    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar" };
  }
}

export async function deleteMenuItem(_: any, formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  try {
    await prisma.menuItem.delete({ where: { id } });
    revalidatePath("/settings/menu");
    return { success: true };
  } catch (error) {
    return { error: "Error al eliminar" };
  }
}
