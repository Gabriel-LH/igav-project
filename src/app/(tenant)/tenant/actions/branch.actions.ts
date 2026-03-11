"use server";

import { PrismaBranchAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-branch.adapter";
import { ListBranchesUseCase } from "@/src/application/tenant/use-cases/listBranches.usecase";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";

export async function getBranchesAction() {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) {
      return { success: false, error: "El ID del tenant es obligatorio." };
    }

    const branchRepo = new PrismaBranchAdapter();
    const listBranchesUseCase = new ListBranchesUseCase(branchRepo);

    const branches = await listBranchesUseCase.execute(tenantId);

    return { success: true, data: branches };
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido al obtener sucursales" 
    };
  }
}
