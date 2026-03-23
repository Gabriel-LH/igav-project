"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { PrismaCouponRepository } from "@/src/infrastructure/tenant/repositories/PrismaCouponRepository";

export async function getCouponsByClientIdsAction(clientIds: string[]) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId } = membership;

    if (!tenantId) {
      throw new Error("Tenant ID es obligatorio");
    }

    const couponRepo = new PrismaCouponRepository(prisma);
    const coupons = await couponRepo.getCouponsByClientIds(tenantId, clientIds);

    return { success: true, data: coupons };
  } catch (error) {
    console.error("Error al obtener cupones:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudieron obtener los cupones",
    };
  }
}
