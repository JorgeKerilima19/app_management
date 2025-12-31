// app/settings/staff/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Define valid roles as const array for type safety
const VALID_ROLES = [
  "MESERO",
  "COCINERO",
  "BARISTA",
  "CAJERO",
  "ADMIN",
] as const;
type ValidRole = (typeof VALID_ROLES)[number]; // = 'MESERO' | 'COCINERO' | ...

function isValidRole(role: string): role is ValidRole {
  return VALID_ROLES.includes(role as ValidRole);
}

export type StaffFormState = {
  message: string;
  error: boolean;
};

// ✅ Action for useFormState: (prevState, formData)
export async function createStaffAction(
  prevState: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString();

  if (!name || !email || !password || !role) {
    return { message: "Todos los campos son requeridos", error: true };
  }

  if (!isValidRole(role)) {
    return { message: "Rol inválido", error: true };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role, // ✅ Now typed as ValidRole → assignable to Prisma Role
      },
    });
    revalidatePath("/settings/staff");
    return { message: "Personal añadido exitosamente", error: false };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { message: "El email ya está en uso", error: true };
    }
    return { message: "Error al crear el usuario", error: true };
  }
}

export type DeleteStaffState = {
  message: string;
  success: boolean;
};

// ✅ Fixed delete action: returns state
export async function deleteUserAction(
  prevState: DeleteStaffState,
  formData: FormData
): Promise<DeleteStaffState> {
  const id = formData.get('id')?.toString();
  if (!id) {
    return { message: 'ID requerido', success: false };
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return { message: 'Usuario no encontrado', success: false };
  }

  if (user.role === 'OWNER') {
    return { message: 'No se puede eliminar al dueño', success: false };
  }

  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/settings/staff');
    return { message: 'Usuario eliminado', success: true };
  } catch (error) {
    return { message: 'Error al eliminar', success: false };
  }
}