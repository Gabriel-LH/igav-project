import {
  RoleRepository,
  CreateRoleDTO,
  UpdateRolePermissionsDTO,
  RoleDTO,
} from "@/src/domain/tenant/repositories/RoleRepository";
import { PrismaRoleAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-role.adapter";

export class CrudRoleUseCase {
  private roleRepository: RoleRepository;

  constructor() {
    this.roleRepository = new PrismaRoleAdapter();
  }

  async executeGetAll(tenantId: string): Promise<RoleDTO[]> {
    if (!tenantId) throw new Error("tenantId is required");
    return this.roleRepository.findAll(tenantId);
  }

  async executeGetById(id: string, tenantId: string): Promise<RoleDTO | null> {
    if (!id || !tenantId) throw new Error("id and tenantId are required");
    return this.roleRepository.findById(id, tenantId);
  }

  async executeCreate(dto: CreateRoleDTO): Promise<RoleDTO> {
    if (!dto.tenantId) throw new Error("tenantId is required");
    if (!dto.name?.trim()) throw new Error("Role name is required");
    if (!dto.permissionKeys?.length)
      throw new Error("At least one permission is required");
    return this.roleRepository.create(dto);
  }

  async executeUpdatePermissions(
    dto: UpdateRolePermissionsDTO,
  ): Promise<RoleDTO> {
    if (!dto.roleId || !dto.tenantId)
      throw new Error("roleId and tenantId are required");
    // Validate the role belongs to this tenant
    const existing = await this.roleRepository.findById(
      dto.roleId,
      dto.tenantId,
    );
    if (!existing) throw new Error("Role not found in this tenant");
    return this.roleRepository.updatePermissions(dto);
  }

  async executeDelete(id: string, tenantId: string): Promise<void> {
    if (!id || !tenantId) throw new Error("id and tenantId are required");
    const existing = await this.roleRepository.findById(id, tenantId);
    if (!existing) throw new Error("Role not found in this tenant");
    if (existing.isSystem) throw new Error("System roles cannot be deleted");
    if ((existing._count?.userTenantMemberships ?? 0) > 0) {
      throw new Error(
        "Cannot delete a role that has active members. Reassign them first.",
      );
    }
    return this.roleRepository.delete(id, tenantId);
  }
}
