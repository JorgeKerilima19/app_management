// app/settings/tables/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

// Create table
export async function createTable(_: any, formData: FormData) {
  const name = formData.get("name")?.toString();
  const capacityStr = formData.get("capacity")?.toString();

  if (!name?.trim()) return { error: "Nombre es requerido" };
  if (!capacityStr) return { error: "Capacidad es requerida" };

  const capacity = parseInt(capacityStr, 10);
  if (isNaN(capacity) || ![4, 8].includes(capacity)) {
    return { error: "Capacidad debe ser 4 o 8" };
  }

  try {
    // Auto-assign next available number
    const lastTable = await prisma.table.findFirst({
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const number = (lastTable?.number || 0) + 1;

    await prisma.table.create({
      data: {
        number,
        name: name.trim(),
        capacity,
        status: "AVAILABLE",
      },
    });
    revalidatePath("/settings/tables");
    return { success: true };
  } catch (error) {
    return { error: "Error al crear la mesa" };
  }
}

// Update table
export async function updateTable(_: any, formData: FormData) {
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString();
  const capacityStr = formData.get("capacity")?.toString();

  if (!id || !name?.trim()) return { error: "Datos inválidos" };
  if (!capacityStr) return { error: "Capacidad es requerida" };

  const capacity = parseInt(capacityStr, 10);
  if (isNaN(capacity) || ![4, 8].includes(capacity)) {
    return { error: "Capacidad debe ser 4 o 8" };
  }

  try {
    await prisma.table.update({
      where: { id },
      data: { name: name.trim(), capacity },
    });
    revalidatePath("/settings/tables");
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar" };
  }
}

// Delete table
export async function deleteTable(_: any, formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  try {
    await prisma.table.delete({ where: { id } });
    revalidatePath("/settings/tables");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2025") {
      return { error: "Mesa no encontrada" };
    }
    return { error: "Error al eliminar" };
  }
}
