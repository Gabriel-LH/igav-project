import {
  RoleRepository,
  RoleDTO,
  CreateRoleDTO,
  UpdateRolePermissionsDTO,
} from "@/src/domain/tenant/repositories/RoleRepository";
import prisma from "@/src/lib/prisma";

const roleInclude = {
  permissions: {
    include: {
      permission: {
        select: { key: true, module: true, description: true },
      },
    },
  },
  _count: { select: { userTenantMemberships: true } },
  userTenantMemberships: {
    select: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  },
  userBranchAccesses: {
    select: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  },
} as const;

function mapRole(raw: any): RoleDTO {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    name: raw.name,
    description: raw.description,
    isSystem: raw.isSystem,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    permissions: raw.permissions.map((rp: any) => rp.permission),
    _count: raw._count,
    users: Array.from(
      new Map(
        [
          ...(raw.userTenantMemberships?.map((m: any) => m.user) ?? []),
          ...(raw.userBranchAccesses?.map((m: any) => m.user) ?? []),
        ].map((u) => [u.id, u]),
      ).values(),
    ),
  };
}

export class PrismaRoleAdapter implements RoleRepository {
  async findAll(tenantId: string): Promise<RoleDTO[]> {
    const roles = await prisma.role.findMany({
      where: { tenantId },
      include: roleInclude,
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });
    return roles.map(mapRole);
  }

  async findById(id: string, tenantId: string): Promise<RoleDTO | null> {
    const role = await prisma.role.findFirst({
      where: { id, tenantId },
      include: roleInclude,
    });
    return role ? mapRole(role) : null;
  }

  async create(dto: CreateRoleDTO): Promise<RoleDTO> {
    // Resolve permission IDs from global keys
    const permissions = await prisma.permission.findMany({
      where: { key: { in: dto.permissionKeys }, tenantId: null },
      select: { id: true, key: true },
    });

    const role = await prisma.role.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        description: dto.description ?? null,
        isSystem: false,
        permissions: {
          create: permissions.map((p) => ({
            tenantId: dto.tenantId,
            permissionId: p.id,
          })),
        },
      },
      include: roleInclude,
    });
    return mapRole(role);
  }

  async updatePermissions(dto: UpdateRolePermissionsDTO): Promise<RoleDTO> {
    // Resolve IDs from keys
    const permissions = await prisma.permission.findMany({
      where: { key: { in: dto.permissionKeys }, tenantId: null },
      select: { id: true },
    });

    await prisma.$transaction([
      // Remove current permissions for this role
      prisma.rolePermission.deleteMany({ where: { roleId: dto.roleId } }),
      // Add new ones
      prisma.rolePermission.createMany({
        data: permissions.map((p) => ({
          tenantId: dto.tenantId,
          roleId: dto.roleId,
          permissionId: p.id,
        })),
        skipDuplicates: true,
      }),
    ]);

    const updated = await prisma.role.findFirstOrThrow({
      where: { id: dto.roleId, tenantId: dto.tenantId },
      include: roleInclude,
    });
    return mapRole(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.role.delete({ where: { id } }),
    ]);
  }
}
