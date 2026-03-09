"use server";

import { requireSuperAdmin } from "@/src/infrastructure/superadmin/auth.guard";
import { revalidatePath } from "next/cache";
import prisma from "@/src/lib/prisma";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[-\s]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function isSlugAvailable(slug: string) {
  const existing = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });
  return !existing;
}

export async function checkTenantSlugAvailabilityAction(rawSlug: string) {
  await requireSuperAdmin();

  const slug = slugify(rawSlug || "");
  if (!slug) {
    return { available: false, slug };
  }

  const available = await isSlugAvailable(slug);
  return { available, slug };
}

// ─── Permission key groups per system role ────────────────────────────────────
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

export async function createTenantAction(formData: FormData) {
  const superadminUser = await requireSuperAdmin();

  const name = ((formData.get("name") as string) || "").trim();
  const rawSlug = ((formData.get("slug") as string) || "").trim();
  const slug = slugify(rawSlug || name);
  const ownerName = ((formData.get("ownerName") as string) || "").trim();
  const ownerEmail = ((formData.get("ownerEmail") as string) || "")
    .trim()
    .toLowerCase();
  const ownerPassword = (
    (formData.get("ownerPassword") as string) || ""
  ).trim();

  if (!name || !slug) {
    throw new Error("Name and slug are required.");
  }
  if (ownerEmail && !ownerPassword) {
    throw new Error("Owner password is required when owner email is provided.");
  }
  if (ownerPassword && ownerPassword.length < 8) {
    throw new Error("Owner password must have at least 8 characters.");
  }

  const available = await isSlugAvailable(slug);
  if (!available) {
    throw new Error("Slug already exists. Please choose a different one.");
  }

  // Load all global system permissions BEFORE the transaction
  const allPermissions = await prisma.permission.findMany({
    where: { tenantId: null },
    select: { id: true, key: true },
  });

  if (allPermissions.length === 0) {
    throw new Error(
      "System permissions have not been seeded. Run `npx prisma db seed` first.",
    );
  }

  const permMap = new Map(allPermissions.map((p) => [p.key, p.id]));
  const resolveIds = (keys: string[]) =>
    keys.flatMap((k) =>
      permMap.has(k) ? [{ permissionId: permMap.get(k)! }] : [],
    );

  try {
    await prisma.$transaction(async (tx) => {
      // ── 1. Owner user ──────────────────────────────────────────────────────
      let ownerId = superadminUser.id;

      if (ownerEmail) {
        const existingOwner = await tx.user.findUnique({
          where: { email: ownerEmail },
          select: { id: true },
        });

        if (existingOwner) {
          ownerId = existingOwner.id;
          const existingCredentialAccount = await tx.account.findFirst({
            where: { userId: ownerId, providerId: "credential" },
            select: { id: true },
          });
          if (!existingCredentialAccount && ownerPassword) {
            await tx.account.create({
              data: {
                id: randomUUID(),
                accountId: ownerEmail,
                providerId: "credential",
                userId: ownerId,
                password: await hashPassword(ownerPassword),
              },
            });
          }
        } else {
          const ownerUserId = randomUUID();
          const fallbackOwnerName = ownerEmail.split("@")[0] || "Tenant Owner";

          await tx.user.create({
            data: {
              id: ownerUserId,
              email: ownerEmail,
              name: ownerName || fallbackOwnerName,
              emailVerified: true,
              status: "active",
              globalRole: "USER",
              createdBy: superadminUser.id,
              updatedBy: superadminUser.id,
            },
          });

          await tx.account.create({
            data: {
              id: randomUUID(),
              accountId: ownerEmail,
              providerId: "credential",
              userId: ownerUserId,
              password: await hashPassword(ownerPassword),
            },
          });

          ownerId = ownerUserId;
        }
      }

      // ── 2. Tenant ──────────────────────────────────────────────────────────
      const tenant = await tx.tenant.create({
        data: {
          name,
          slug,
          ownerId,
          status: "active",
          metadata: { createdBySuperAdminId: superadminUser.id },
        },
      });

      // ── 3. Primary branch ──────────────────────────────────────────────────
      const now = new Date();
      const defaultBranch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          code: "MAIN",
          name: "Principal",
          city: "Lima",
          address: "Por definir",
          status: "active",
          isPrimary: true,
          createdBy: superadminUser.id,
          updatedBy: superadminUser.id,
        },
        select: { id: true },
      });

      const tenantId = tenant.id;

      // ── 4. System roles with permissions ───────────────────────────────────

      // owner → ALL permissions
      const ownerRole = await tx.role.create({
        data: {
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
        select: { id: true },
      });

      // admin
      await tx.role.create({
        data: {
          tenantId,
          name: "admin",
          description: "Gestión completa excepto configuración del sistema",
          isSystem: true,
          permissions: {
            create: resolveIds(ADMIN_KEYS).map((p) => ({ ...p, tenantId })),
          },
        },
      });

      // vendedor
      await tx.role.create({
        data: {
          tenantId,
          name: "vendedor",
          description: "Ventas, alquileres, reservas y atención al cliente",
          isSystem: true,
          permissions: {
            create: resolveIds(VENDEDOR_KEYS).map((p) => ({ ...p, tenantId })),
          },
        },
      });

      // cajero
      await tx.role.create({
        data: {
          tenantId,
          name: "cajero",
          description: "Operaciones de caja: ventas, cobros y atención básica",
          isSystem: true,
          permissions: {
            create: resolveIds(CAJERO_KEYS).map((p) => ({ ...p, tenantId })),
          },
        },
      });

      // ── 5. Owner membership ────────────────────────────────────────────────
      await tx.userTenantMembership.create({
        data: {
          userId: ownerId,
          tenantId,
          roleId: ownerRole.id,
          defaultBranchId: defaultBranch.id,
          status: "active",
          invitedBy: superadminUser.id,
          createdAt: now,
          updatedAt: now,
        },
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error);
    if (message.includes("unique") && message.includes("email")) {
      throw new Error("Owner email already exists with conflicting data.");
    }
    if (message.includes("unique") && message.includes("slug")) {
      throw new Error("Slug already exists. Please choose a different one.");
    }
    throw error;
  }

  revalidatePath("/superadmin/tenants");
}
