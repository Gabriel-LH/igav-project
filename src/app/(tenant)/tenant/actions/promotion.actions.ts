"use server";

import { PrismaPromotionAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-promotion.adapter";
import { CreatePromotionUseCase } from "@/src/application/tenant/use-cases/promotion/createPromotion.usecase";
import { ListPromotionsUseCase } from "@/src/application/tenant/use-cases/promotion/listPromotions.usecase";
import { TogglePromotionUseCase } from "@/src/application/tenant/use-cases/promotion/togglePromotion.usecase";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { Promotion } from "@/src/types/promotion/type.promotion";
import { revalidatePath } from "next/cache";
import { CalculateCartPromotionsUseCase } from "@/src/application/tenant/use-cases/promotion/CalculateCartPromotionsUseCase";
import { PrismaInventoryRepository } from "@/src/infrastructure/tenant/repositories/PrismaInventoryRepository";
import { PrismaConfigAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-config.adapter";
import { CartItem } from "@/src/types/cart/type.cart";
import prisma from "@/src/lib/prisma";

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
  promotion: Omit<Promotion, "id" | "tenantId" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "usedCount">,
) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    const userId = membership.user.id as string;

    if (!tenantId) throw new Error("Tenant ID not found");

    const promoRepo = new PrismaPromotionAdapter();
    const useCase = new CreatePromotionUseCase(promoRepo);
    // Cast to any to bypass the complex Omit/Partial logic if needed, 
    // but the useCase expects a promotion object that matches what we're sending.
    const newPromo = await useCase.execute({ 
      tenantId, 
      userId, 
      promotion: promotion as any 
    });

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

export async function updatePromotionAction(
  promotionId: string,
  promotion: Partial<Omit<Promotion, "id" | "tenantId" | "createdAt" | "createdBy" | "usedCount">>,
) {
  try {
    await requireTenantMembership(); // Auth check

    const promoRepo = new PrismaPromotionAdapter();
    await promoRepo.updatePromotion(promotionId, promotion);

    revalidatePath("/tenant/inventory/promotions");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar promoción:", error);
    return { success: false, error: "No se pudo actualizar la promoción" };
  }
}

export async function deletePromotionAction(promotionId: string) {
  try {
    await requireTenantMembership(); // Auth check

    const promoRepo = new PrismaPromotionAdapter();
    await promoRepo.deletePromotion(promotionId);

    revalidatePath("/tenant/inventory/promotions");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar promoción:", error);
    return { success: false, error: "No se pudo eliminar la promoción" };
  }
}

export async function calculateCartAction(
  items: CartItem[],
  branchId: string,
  dates?: { from: Date; to: Date }
) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) throw new Error("Tenant ID not found");

    const promoRepo = new PrismaPromotionAdapter();
    const inventoryRepo = new PrismaInventoryRepository(prisma);
    const configRepo = new PrismaConfigAdapter();
    
    const config = await configRepo.getTenantConfig(tenantId);
    if (!config) throw new Error("Tenant config not found");

    const useCase = new CalculateCartPromotionsUseCase(promoRepo, inventoryRepo);
    
    const result = await useCase.execute({
      items,
      tenantId,
      branchId,
      startDate: dates?.from,
      endDate: dates?.to,
      config,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error al calcular promociones del carrito:", error);
    return { success: false, error: "Error al calcular descuentos" };
  }
}
