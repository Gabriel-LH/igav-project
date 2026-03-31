"use server";

import { PrismaBranchAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-branch.adapter";
import { PrismaConfigAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-config.adapter";
import { ListBranchesUseCase } from "@/src/application/tenant/use-cases/listBranches.usecase";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import prisma from "@/src/lib/prisma";

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

export async function getBranchConfigAction(branchId: string) {
  try {
    const membership = await requireTenantMembership();
    if (!membership.tenantId) throw new Error("Tenant ID not found");

    const configRepo = new PrismaConfigAdapter();
    const config = await configRepo.getBranchConfig(branchId);

    return { success: true, data: config };
  } catch (error) {
    console.error("Error al obtener configuración de sucursal:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
}

export async function getBranchMetricsAction(branchId: string) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) throw new Error("Tenant ID not found");

    // Calcular "Hoy" en Lima (UTC-5) para evitar desfases con el servidor
    const now = new Date();
    // Offset de -5 horas para Lima
    const LIMA_OFFSET = -5;
    const limaNow = new Date(now.getTime() + LIMA_OFFSET * 60 * 60 * 1000);
    const todayLima = new Date(limaNow.toISOString().split("T")[0] + "T00:00:00.000Z");
    // Volvemos a ajustar para que la consulta a la BD (que suele estar en UTC) sea correcta
    const todayUtcStart = new Date(todayLima.getTime() - LIMA_OFFSET * 60 * 60 * 1000);

    const [staffCount, membersWithDefaultBranchCount, cashSessionSum, attendanceCount] = await Promise.all([
      // 1. Empleados con acceso explícito (Tabla userBranchAccess)
      prisma.userBranchAccess.count({
        where: { branchId, status: "active" },
      }),
      // 2. Miembros que tienen esta sucursal como predeterminada (Tabla tenant_member_ship)
      // Útil para el creador/admin que a veces no está en userBranchAccess
      prisma.userTenantMembership.count({
        where: { tenantId, defaultBranchId: branchId, status: "active" },
      }),
      // 3. Montos de apertura de hoy
      prisma.cashSession.aggregate({
        _sum: { openingAmount: true },
        where: {
          branchId,
          openedAt: { gte: todayUtcStart },
        },
      }),
      // 4. Asistencias de hoy
      prisma.userAttendance.count({
        where: {
          branchId,
          workDate: { gte: todayUtcStart },
        },
      }),
    ]);

    // Combinar el conteo de staff. 
    // Usamos el máximo para evitar contar doble si están en ambas tablas con los mismos criterios,
    // o simplemente sumamos si son excluyentes. En este esquema, el Admin suele estar en Membership.
    const employeeCount = Math.max(staffCount, membersWithDefaultBranchCount);

    console.log(`[Metrics DEBUG] Branch ${branchId} | StaffTable: ${staffCount} | DefaultBranchMembers: ${membersWithDefaultBranchCount} | Today: ${todayUtcStart.toISOString()}`);

    return {
      success: true,
      data: {
        employeeCount,
        currentCash: cashSessionSum._sum.openingAmount || 0,
        todayAttendance: attendanceCount,
      },
    };
  } catch (error) {
    console.error("Error al obtener métricas de sucursal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
