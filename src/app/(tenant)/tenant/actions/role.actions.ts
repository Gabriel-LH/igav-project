"use server";

import { CrudRoleUseCase } from "@/src/application/tenant/use-cases/role/crudRole.usecase";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { revalidatePath } from "next/cache";

const roleUseCase = new CrudRoleUseCase();

async function getTenantId(): Promise<string> {
  const membership = await requireTenantMembership();
  if (!membership.tenantId)
    throw new Error("No tenant associated with this account");
  return membership.tenantId;
}

export async function getRolesAction() {
  const tenantId = await getTenantId();
  return roleUseCase.executeGetAll(tenantId);
}

export async function createRoleAction(data: {
  name: string;
  description?: string;
  permissionKeys: string[];
}) {
  const tenantId = await getTenantId();
  const result = await roleUseCase.executeCreate({
    tenantId,
    name: data.name,
    description: data.description,
    permissionKeys: data.permissionKeys,
  });
  revalidatePath("/tenant/roles");
  return result;
}

export async function updateRolePermissionsAction(
  roleId: string,
  permissionKeys: string[],
) {
  const tenantId = await getTenantId();
  const result = await roleUseCase.executeUpdatePermissions({
    roleId,
    tenantId,
    permissionKeys,
  });
  revalidatePath("/tenant/roles");
  return result;
}

export async function deleteRoleAction(roleId: string) {
  const tenantId = await getTenantId();
  await roleUseCase.executeDelete(roleId, tenantId);
  revalidatePath("/tenant/roles");
}

export async function getSystemPermissionsAction() {
  // Global permissions (tenantId = null) grouped by module — used by RoleForm
  const { default: prisma } = await import("@/src/lib/prisma");
  const permissions = await prisma.permission.findMany({
    where: { tenantId: null },
    select: { id: true, key: true, module: true, description: true },
    orderBy: [{ module: "asc" }, { key: "asc" }],
  });
  return permissions;
}
