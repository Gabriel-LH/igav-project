"use server";

import prisma from "@/src/lib/prisma";
import { PrismaCashSessionRepository } from "@/src/infrastructure/tenant/repositories/PrismaCashSessionRepository";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";

export async function getCashSessionsAction() {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) throw new Error("Tenant ID not found");

    const repo = new PrismaCashSessionRepository(prisma);
    const sessions = await repo.getSessionsByTenant(tenantId);

    return { success: true, data: sessions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
