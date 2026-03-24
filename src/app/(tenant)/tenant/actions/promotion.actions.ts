"use server";

import { PrismaPromotionAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-promotion.adapter";
import { CreatePromotionUseCase } from "@/src/application/tenant/use-cases/promotion/createPromotion.usecase";
import { ListPromotionsUseCase } from "@/src/application/tenant/use-cases/promotion/listPromotions.usecase";
import { TogglePromotionUseCase } from "@/src/application/tenant/use-cases/promotion/togglePromotion.usecase";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { Promotion } from "@/src/types/promotion/type.promotion";
import { revalidatePath } from "next/cache";

export async function getPromotionsAction(includeInactive = false) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) throw new Error("Tenant ID not found");

    const promoRepo = new PrismaPromotionAdapter();
    const useCase = new ListPromotionsUseCase(promoRepo);
    const promotions = await useCase.execute(tenantId, includeInactive);

    return { success: true, data: promotions };
  } catch (error) {
    console.error("Error al obtener promociones:", error);
    return { success: false, error: "No se pudieron obtener las promociones" };
  }
}

export async function createPromotionAction(
  promotion: Omit<Promotion, "id" | "tenantId" | "createdAt" | "createdBy">,
) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    const userId = membership.user.id as string;

    if (!tenantId) throw new Error("Tenant ID not found");

    const promoRepo = new PrismaPromotionAdapter();
    const useCase = new CreatePromotionUseCase(promoRepo);
    const newPromo = await useCase.execute({ tenantId, userId, promotion });

    revalidatePath("/tenant/inventory/promotions");
    return { success: true, data: newPromo };
  } catch (error) {
    console.error("Error al crear promoción:", error);
    return { success: false, error: "No se pudo crear la promoción" };
  }
}

export async function togglePromotionAction(
  promotionId: string,
  isActive: boolean,
) {
  try {
    await requireTenantMembership(); // Auth check

    const promoRepo = new PrismaPromotionAdapter();
    const useCase = new TogglePromotionUseCase(promoRepo);
    await useCase.execute(promotionId, isActive);

    revalidatePath("/tenant/inventory/promotions");
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar estado de promoción:", error);
    return { success: false, error: "No se pudo cambiar el estado" };
  }
}
