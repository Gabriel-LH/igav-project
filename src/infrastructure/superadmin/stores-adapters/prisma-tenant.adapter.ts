import {
  TenantRepository,
  CreateTenantDTO,
  UpdateTenantDTO,
} from "@/src/domain/superadmin/repositories/TenantRepository";
import prisma from "@/src/lib/prisma";
import { TenantStatus } from "@/prisma/generated/client";
import { randomUUID } from "crypto";

// ─── Permission keys per system role ────────────────────────────────────────
// admin: everything except billing, role management above admin, and system permissions
const ADMIN_KEYS = [
  "sales.view",
  "sales.create",
  "sales.edit",
  "sales.cancel",
  "sales.delete",
  "rentals.view",
  "rentals.create",
  "rentals.edit",
  "rentals.return",
  "rentals.cancel",
  "rentals.delete",
  "reservations.view",
  "reservations.create",
  "reservations.edit",
  "reservations.cancel",
  "inventory.view",
  "inventory.create",
  "inventory.edit",
  "inventory.delete",
  "clients.view",
  "clients.create",
  "clients.edit",
  "clients.delete",
  "products.view",
  "products.create",
  "products.edit",
  "products.delete",
  "promotions.view",
  "promotions.create",
  "promotions.edit",
  "promotions.delete",
  "payments.view",
  "payments.create",
  "payments.edit",
  "referrals.view",
  "referrals.create",
  "referrals.edit",
  "referralRewards.view",
  "referralRewards.create",
  "users.view",
  "users.create",
  "users.edit",
  "users.delete",
  "roles.view",
  "roles.create",
  "roles.edit",
  "roles.delete",
  "branches.view",
  "branches.create",
  "branches.edit",
  "userAttendance.view",
  "userAttendance.create",
  "userAttendance.edit",
  "userAttendance.delete",
  "userBranchAccess.view",
  "userBranchAccess.create",
  "userBranchAccess.edit",
  "userBranchAccess.delete",
  "userTenantMembership.view",
  "userTenantMembership.create",
  "userTenantMembership.edit",
  "permissions.view",
];

// empleado: daily operations (sales, rentals, reservations, clients, attendance)
const VENDEDOR_KEYS = [
  "sales.view",
  "sales.create",
  "rentals.view",
  "rentals.create",
  "rentals.return",
  "reservations.view",
  "reservations.create",
  "reservations.edit",
  "reservations.cancel",
  "inventory.view",
  "clients.view",
  "clients.create",
  "clients.edit",
  "products.view",
  "payments.view",
  "payments.create",
  "referrals.view",
  "referrals.create",
  "userAttendance.view",
  "userAttendance.create",
];

// cajero: cashier — sales/rentals reading + payments + attendance
const CAJERO_KEYS = [
  "sales.view",
  "sales.create",
  "rentals.view",
  "rentals.create",
  "reservations.view",
  "clients.view",
  "clients.create",
  "products.view",
  "payments.view",
  "payments.create",
  "userAttendance.view",
  "userAttendance.create",
];

export class PrismaTenantAdapter implements TenantRepository {
  async create(data: CreateTenantDTO): Promise<any> {
    return prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        ownerId: data.ownerId,
        status: TenantStatus.active,
        metadata: data.metadata ?? {},
      },
    });
  }

  async update(id: string, data: UpdateTenantDTO): Promise<any> {
    return prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.status && { status: data.status }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
      },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
        tenantModules: true,
        tenantPolicies: true,
        tenantSubscriptions: true,
      },
    });
  }

  async findAll(): Promise<any[]> {
    return prisma.tenant.findMany({ orderBy: { createdAt: "desc" } });
  }

  async suspend(id: string): Promise<any> {
    return prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.suspended },
    });
  }

  async provisionSystemRoles(tenantId: string, ownerId: string): Promise<void> {
    // 1. Fetch all global permissions (tenantId = null) that were seeded
    const allPermissions = await prisma.permission.findMany({
      where: { tenantId: null },
      select: { id: true, key: true },
    });

    const permMap = new Map(allPermissions.map((p) => [p.key, p.id]));
    const resolveIds = (keys: string[]) =>
      keys.flatMap((k) => (permMap.has(k) ? [permMap.get(k)!] : []));

    // 2. Create the 4 system roles inside a transaction
    const ownerRoleId = randomUUID();
    const adminRoleId = randomUUID();
    const empRoleId = randomUUID();
    const cajeroRoleId = randomUUID();

    await prisma.$transaction(async (tx) => {
      // owner — all permissions
      await tx.role.create({
        data: {
          id: ownerRoleId,
          tenantId,
          name: "owner",
          description: "Acceso total al sistema",
          isSystem: true,
          permissions: {
            create: allPermissions.map((p) => ({
              tenantId,
              permissionId: p.id,
            })),
          },
        },
      });

      // admin
      await tx.role.create({
        data: {
          id: adminRoleId,
          tenantId,
          name: "admin",
          description:
            "Gestión completa excepto facturación y roles del sistema",
          isSystem: true,
          permissions: {
            create: resolveIds(ADMIN_KEYS).map((id) => ({
              tenantId,
              permissionId: id,
            })),
          },
        },
      });

      // vendedor
      await tx.role.create({
        data: {
          id: empRoleId,
          tenantId,
          name: "vendedor",
          description: "Ventas, alquileres, reservas y atención al cliente",
          isSystem: true,
          permissions: {
            create: resolveIds(VENDEDOR_KEYS).map((id) => ({
              tenantId,
              permissionId: id,
            })),
          },
        },
      });

      // cajero
      await tx.role.create({
        data: {
          id: cajeroRoleId,
          tenantId,
          name: "cajero",
          description: "Operaciones de caja: ventas, cobros y atención básica",
          isSystem: true,
          permissions: {
            create: resolveIds(CAJERO_KEYS).map((id) => ({
              tenantId,
              permissionId: id,
            })),
          },
        },
      });
    });

    // 3. Create the owner's UserTenantMembership using the primary branch (if it exists)
    const primaryBranch = await prisma.branch.findFirst({
      where: { tenantId },
      orderBy: { isPrimary: "desc" },
    });

    if (primaryBranch) {
      const now = new Date();
      await prisma.userTenantMembership.upsert({
        where: { id: `${ownerId}-${tenantId}` },
        update: {},
        create: {
          id: `${ownerId}-${tenantId}`,
          userId: ownerId,
          tenantId,
          roleId: ownerRoleId,
          defaultBranchId: primaryBranch.id,
          status: "active",
          invitedBy: ownerId,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  }
}
