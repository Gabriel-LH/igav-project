"use server";

import { revalidatePath } from "next/cache";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import prisma from "@/src/lib/prisma";
import { assertValidPin, hashPin, verifyPin } from "@/src/lib/security/pin";

const AUTHORIZED_ROLE_NAMES = new Set(["ADMIN", "OWNER", "MANAGER", "ADMINISTRADOR"]);

function isAuthorizedRoleName(roleName: string | null | undefined) {
  if (!roleName) {
    return false;
  }

  return AUTHORIZED_ROLE_NAMES.has(roleName.trim().toUpperCase());
}

export async function getUserPinStatusAction() {
  try {
    const { membership } = await requireTenantMembership();

    if (!membership) {
      throw new Error("Membresia de tenant no encontrada");
    }

    return {
      success: true,
      data: {
        hasPinConfigured: Boolean(membership.pinHash),
        pinSetAt: membership.pinSetAt?.toISOString() ?? null,
      },
    };
  } catch (error: any) {
    console.error("Error al obtener estado del PIN:", error);
    return {
      success: false,
      error: error.message || "No se pudo obtener el estado del PIN",
    };
  }
}

export async function setUserPinAction(pin: string) {
  try {
    const { membership } = await requireTenantMembership();

    if (!membership) {
      throw new Error("Membresia de tenant no encontrada");
    }

    assertValidPin(pin);
    const pinHash = await hashPin(pin);

    await prisma.userTenantMembership.update({
      where: { id: membership.id },
      data: {
        pinHash,
        pinSetAt: new Date(),
      },
    });

    revalidatePath("/tenant/settings");
    revalidatePath("/tenant/policies");
    return { success: true };
  } catch (error: any) {
    console.error("Error al establecer PIN:", error);
    return {
      success: false,
      error: error.message || "No se pudo establecer el PIN",
    };
  }
}

export async function clearUserPinAction() {
  try {
    const { membership } = await requireTenantMembership();

    if (!membership) {
      throw new Error("Membresia de tenant no encontrada");
    }

    await prisma.userTenantMembership.update({
      where: { id: membership.id },
      data: {
        pinHash: null,
        pinSetAt: null,
      },
    });

    revalidatePath("/tenant/settings");
    revalidatePath("/tenant/policies");
    return { success: true };
  } catch (error: any) {
    console.error("Error al limpiar PIN:", error);
    return {
      success: false,
      error: error.message || "No se pudo limpiar el PIN",
    };
  }
}

export async function validateAdminPinAction(pin: string) {
  try {
    const currentMember = await requireTenantMembership();
    const tenantId = currentMember.tenantId;

    if (!tenantId) {
      throw new Error("Tenant no encontrado");
    }

    assertValidPin(pin);

    const candidates = await prisma.userTenantMembership.findMany({
      where: {
        tenantId,
        status: "active",
        pinHash: { not: null },
      },
      select: {
        pinHash: true,
        role: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    for (const membership of candidates) {
      if (!isAuthorizedRoleName(membership.role?.name)) {
        continue;
      }

      const matches = await verifyPin(pin, membership.pinHash);
      if (matches) {
        return {
          success: true,
          authorizedBy: membership.user.name,
        };
      }
    }

    return {
      success: false,
      error: "PIN invalido o usuario no autorizado",
    };
  } catch (error: any) {
    console.error("Error al validar PIN:", error);
    return { success: false, error: "Error de validacion" };
  }
}
