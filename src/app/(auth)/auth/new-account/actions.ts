"use server";

import prisma from "@/src/lib/prisma";

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

export async function checkTenantSlugAvailabilityPublicAction(rawSlug: string) {
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

type CreateTenantInput = {
  tenantName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  branchName: string;
  city: string;
  address: string;
  phone?: string;
  planId?: string;
  trialDays?: number;
};

export async function createTenantFromSignupAction(input: CreateTenantInput) {
  const tenantName = (input.tenantName || "").trim();
  const ownerName = (input.ownerName || "").trim();
  const ownerEmail = (input.ownerEmail || "").trim().toLowerCase();
  const branchName = (input.branchName || "").trim();
  const city = (input.city || "").trim();
  const address = (input.address || "").trim();
  const phone = (input.phone || "").trim();
  const planId = (input.planId || "").trim();
  const trialDays =
    typeof input.trialDays === "number" && input.trialDays > 0
      ? input.trialDays
      : undefined;
  const slug = slugify(input.slug || tenantName);

  if (!tenantName || !slug) {
    throw new Error("El nombre del tenant y el slug son requeridos.");
  }
  if (!ownerEmail) {
    throw new Error("El correo del owner es requerido.");
  }
  if (!branchName || !city || !address) {
    throw new Error("Completa los datos de la sucursal.");
  }

  const available = await isSlugAvailable(slug);
  if (!available) {
    throw new Error("El slug ya existe. Elige otro.");
  }

  const owner = await prisma.user.findUnique({
    where: { email: ownerEmail },
    select: { id: true, name: true },
  });
  if (!owner) {
    throw new Error("No se encontró el usuario owner. Intenta de nuevo.");
  }

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

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: tenantName,
        slug,
        ownerId: owner.id,
        status: "active",
        metadata: { createdByOwnerId: owner.id },
      },
    });

    const defaultBranch = await tx.branch.create({
      data: {
        tenantId: tenant.id,
        code: "MAIN",
        name: branchName,
        city,
        address,
        phone: phone || null,
        status: "active",
        isPrimary: true,
        createdBy: owner.id,
        updatedBy: owner.id,
      },
      select: { id: true },
    });

    const tenantId = tenant.id;

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

    await tx.userTenantMembership.create({
      data: {
        userId: owner.id,
        tenantId,
        roleId: ownerRole.id,
        defaultBranchId: defaultBranch.id,
        status: "active",
        invitedBy: owner.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    if (planId) {
      const plan = await tx.plan.findUnique({
        where: { id: planId },
        select: { id: true, trialDays: true },
      });

      if (plan) {
        const finalTrialDays = trialDays ?? plan.trialDays ?? 7;
        const trialEndsAt = new Date(now);
        trialEndsAt.setDate(trialEndsAt.getDate() + finalTrialDays);

        const subscription = await tx.tenantSubscription.create({
          data: {
            tenantId,
            planId: plan.id,
            status: "trial",
            billingCycle: "monthly",
            startedAt: now,
            trialEndsAt,
            currentPeriodStart: now,
            currentPeriodEnd: trialEndsAt,
            provider: "manual",
            createdBy: owner.id,
          },
          select: { id: true },
        });

        await tx.tenant.update({
          where: { id: tenantId },
          data: {
            currentSubscriptionId: subscription.id,
          },
        });
      }
    }
  });

  return { ok: true };
}

export async function markUserEmailVerifiedAction(email: string) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) {
    throw new Error("Email requerido.");
  }

  await prisma.user.update({
    where: { email: normalized },
    data: { emailVerified: true },
  });

  return { ok: true };
}
