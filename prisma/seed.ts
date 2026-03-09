import { PrismaClient } from "./generated/client";
import { randomUUID } from "crypto";
import { hashPassword } from "better-auth/crypto";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { getPlanMatrixData } from "../src/mocks/mock.planMatrix";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});
dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PERMISSIONS  (tenantId = null → global, defined by the system)
// These keys mirror PermissionKeyEnum and are the source of truth.
// Each key follows the format: module.action
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PERMISSIONS: {
  key: string;
  module: string;
  description: string;
}[] = [
  // Ventas
  {
    key: "sales.view",
    module: "sales",
    description: "Ver ventas y su historial",
  },
  {
    key: "sales.create",
    module: "sales",
    description: "Registrar nueva venta",
  },
  {
    key: "sales.edit",
    module: "sales",
    description: "Modificar ventas existentes",
  },
  { key: "sales.cancel", module: "sales", description: "Cancelar ventas" },
  {
    key: "sales.delete",
    module: "sales",
    description: "Eliminar ventas (soft-delete)",
  },
  // Alquiler
  {
    key: "rentals.view",
    module: "rentals",
    description: "Ver alquileres activos e historial",
  },
  {
    key: "rentals.create",
    module: "rentals",
    description: "Registrar nuevo alquiler",
  },
  {
    key: "rentals.edit",
    module: "rentals",
    description: "Modificar alquileres activos",
  },
  {
    key: "rentals.return",
    module: "rentals",
    description: "Procesar devolución de items",
  },
  {
    key: "rentals.cancel",
    module: "rentals",
    description: "Cancelar alquiler antes de entrega",
  },
  {
    key: "rentals.delete",
    module: "rentals",
    description: "Eliminar alquiler",
  },
  // Reservas
  {
    key: "reservations.view",
    module: "reservations",
    description: "Ver reservas",
  },
  {
    key: "reservations.create",
    module: "reservations",
    description: "Crear nueva reserva",
  },
  {
    key: "reservations.edit",
    module: "reservations",
    description: "Modificar reservas",
  },
  {
    key: "reservations.cancel",
    module: "reservations",
    description: "Cancelar reservas",
  },
  // Inventario
  {
    key: "inventory.view",
    module: "inventory",
    description: "Ver stock disponible",
  },
  {
    key: "inventory.create",
    module: "inventory",
    description: "Agregar nuevos productos al inventario",
  },
  {
    key: "inventory.edit",
    module: "inventory",
    description: "Modificar productos e items",
  },
  {
    key: "inventory.delete",
    module: "inventory",
    description: "Eliminar items del inventario",
  },
  // Usuarios / equipo
  {
    key: "users.view",
    module: "users",
    description: "Ver miembros del equipo",
  },
  {
    key: "users.create",
    module: "users",
    description: "Invitar y crear usuarios",
  },
  {
    key: "users.edit",
    module: "users",
    description: "Editar datos de usuarios",
  },
  {
    key: "users.delete",
    module: "users",
    description: "Eliminar usuarios del tenant",
  },
  // Roles
  {
    key: "roles.view",
    module: "roles",
    description: "Ver roles y sus permisos",
  },
  {
    key: "roles.create",
    module: "roles",
    description: "Crear roles personalizados",
  },
  {
    key: "roles.edit",
    module: "roles",
    description: "Editar permisos de un rol",
  },
  {
    key: "roles.delete",
    module: "roles",
    description: "Eliminar roles (solo no-sistema)",
  },
  // Tenants (superadmin context)
  {
    key: "tenants.view",
    module: "tenants",
    description: "Ver tenants del sistema",
  },
  {
    key: "tenants.create",
    module: "tenants",
    description: "Crear nuevos tenants",
  },
  {
    key: "tenants.edit",
    module: "tenants",
    description: "Editar datos de tenants",
  },
  { key: "tenants.delete", module: "tenants", description: "Eliminar tenants" },
  // Sucursales
  { key: "branches.view", module: "branches", description: "Ver sucursales" },
  {
    key: "branches.create",
    module: "branches",
    description: "Crear nuevas sucursales",
  },
  {
    key: "branches.edit",
    module: "branches",
    description: "Editar datos de sucursales",
  },
  {
    key: "branches.delete",
    module: "branches",
    description: "Eliminar sucursales",
  },
  // Clientes
  {
    key: "clients.view",
    module: "clients",
    description: "Ver listado de clientes",
  },
  {
    key: "clients.create",
    module: "clients",
    description: "Registrar nuevos clientes",
  },
  {
    key: "clients.edit",
    module: "clients",
    description: "Editar información de clientes",
  },
  {
    key: "clients.delete",
    module: "clients",
    description: "Eliminar clientes sin historial",
  },
  // Productos (catálogo)
  {
    key: "products.view",
    module: "products",
    description: "Ver catálogo de productos",
  },
  {
    key: "products.create",
    module: "products",
    description: "Agregar nuevos productos al catálogo",
  },
  { key: "products.edit", module: "products", description: "Editar productos" },
  {
    key: "products.delete",
    module: "products",
    description: "Eliminar productos",
  },
  // Promociones
  {
    key: "promotions.view",
    module: "promotions",
    description: "Ver promociones activas",
  },
  {
    key: "promotions.create",
    module: "promotions",
    description: "Crear nuevas promociones",
  },
  {
    key: "promotions.edit",
    module: "promotions",
    description: "Editar promociones",
  },
  {
    key: "promotions.delete",
    module: "promotions",
    description: "Eliminar promociones",
  },
  // Referidos
  {
    key: "referrals.view",
    module: "referrals",
    description: "Ver programa de referidos",
  },
  {
    key: "referrals.create",
    module: "referrals",
    description: "Crear referidos",
  },
  {
    key: "referrals.edit",
    module: "referrals",
    description: "Editar referidos",
  },
  {
    key: "referrals.delete",
    module: "referrals",
    description: "Eliminar referidos",
  },
  // Pagos
  {
    key: "payments.view",
    module: "payments",
    description: "Ver pagos registrados",
  },
  {
    key: "payments.create",
    module: "payments",
    description: "Registrar nuevos pagos",
  },
  { key: "payments.edit", module: "payments", description: "Editar pagos" },
  { key: "payments.delete", module: "payments", description: "Eliminar pagos" },
  // Recompensas de referidos
  {
    key: "referralRewards.view",
    module: "referralRewards",
    description: "Ver recompensas por referidos",
  },
  {
    key: "referralRewards.create",
    module: "referralRewards",
    description: "Crear recompensas",
  },
  {
    key: "referralRewards.edit",
    module: "referralRewards",
    description: "Editar recompensas",
  },
  {
    key: "referralRewards.delete",
    module: "referralRewards",
    description: "Eliminar recompensas",
  },
  // Asistencia
  {
    key: "userAttendance.view",
    module: "userAttendance",
    description: "Ver registros de asistencia",
  },
  {
    key: "userAttendance.create",
    module: "userAttendance",
    description: "Registrar asistencia",
  },
  {
    key: "userAttendance.edit",
    module: "userAttendance",
    description: "Editar asistencia",
  },
  {
    key: "userAttendance.delete",
    module: "userAttendance",
    description: "Eliminar registros de asistencia",
  },
  // Acceso a sucursales
  {
    key: "userBranchAccess.view",
    module: "userBranchAccess",
    description: "Ver accesos de usuario a sucursales",
  },
  {
    key: "userBranchAccess.create",
    module: "userBranchAccess",
    description: "Asignar usuario a sucursal",
  },
  {
    key: "userBranchAccess.edit",
    module: "userBranchAccess",
    description: "Editar acceso de usuario",
  },
  {
    key: "userBranchAccess.delete",
    module: "userBranchAccess",
    description: "Revocar acceso de usuario",
  },
  // Membresía (tenant)
  {
    key: "userTenantMembership.view",
    module: "userTenantMembership",
    description: "Ver membresías del tenant",
  },
  {
    key: "userTenantMembership.create",
    module: "userTenantMembership",
    description: "Crear membresía",
  },
  {
    key: "userTenantMembership.edit",
    module: "userTenantMembership",
    description: "Editar membresía",
  },
  {
    key: "userTenantMembership.delete",
    module: "userTenantMembership",
    description: "Eliminar membresía",
  },
  // Permisos (administración de sistema)
  {
    key: "permissions.view",
    module: "permissions",
    description: "Ver permisos del sistema",
  },
  {
    key: "permissions.create",
    module: "permissions",
    description: "Crear permisos (solo sistema)",
  },
  {
    key: "permissions.edit",
    module: "permissions",
    description: "Editar permisos (solo sistema)",
  },
  {
    key: "permissions.delete",
    module: "permissions",
    description: "Eliminar permisos (solo sistema)",
  },
];

async function seedSystemPermissions() {
  console.log("🔐 Seeding system permissions...");
  for (const perm of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { module: perm.module, description: perm.description },
      create: {
        key: perm.key,
        module: perm.module,
        description: perm.description,
        tenantId: null,
      },
    });
  }
  console.log(`✅ ${SYSTEM_PERMISSIONS.length} permissions seeded`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPERADMIN
// ─────────────────────────────────────────────────────────────────────────────
async function seedSuperAdmin() {
  console.log("👤 Seeding SuperAdmin...");

  const email = "2dejunio2003@gmail.com";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("SuperAdmin ya existe, skipping.");
    return;
  }

  const userId = randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      email,
      name: "Super Admin",
      status: "active",
      globalRole: "SUPER_ADMIN",
      createdBy: "system",
      updatedBy: "system",
    },
  });

  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: email,
      providerId: "credential",
      userId,
      password: await hashPassword("Ax23fcw4%0erflk42"),
    },
  });

  console.log("✅ SuperAdmin creado");
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANS  (9 plans = 3 tiers × 3 tracks)
// ─────────────────────────────────────────────────────────────────────────────
async function seedPlans() {
  console.log("\n📦 Seeding plans...");

  // Plans belong to a tenant in the schema, so we use a sentinel "system" tenant
  // that represents the SaaS catalogue (owned by the superadmin).
  const SYSTEM_TENANT_ID = "system-plans-tenant";
  const SYSTEM_TENANT_SLUG = "system-plans";

  // Get the superadmin user as the owner
  const superadmin = await prisma.user.findFirst({
    where: { globalRole: "SUPER_ADMIN" },
    select: { id: true },
  });
  if (!superadmin) {
    console.warn("  ⚠️  No superadmin found — skipping plan seed (run seedSuperAdmin first)");
    return;
  }

  // Upsert system sentinel tenant
  const systemTenant = await prisma.tenant.upsert({
    where: { id: SYSTEM_TENANT_ID },
    update: {},
    create: {
      id: SYSTEM_TENANT_ID,
      name: "Sistema (Catálogo de Planes)",
      slug: SYSTEM_TENANT_SLUG,
      ownerId: superadmin.id,
      status: "active",
      metadata: { isSystemTenant: true },
    },
  });

  const tenantId = systemTenant.id;
  const plans = getPlanMatrixData();
  let seeded = 0;
  let updated = 0;

  for (const plan of plans) {
    try {
      const existing = await prisma.plan.findUnique({
        where: { id: plan.id },
        select: { id: true },
      });

      if (existing) {
        // Re-sync features/modules/limits (idempotent update)
        await prisma.$transaction(async (tx) => {
          await tx.planFeature.deleteMany({ where: { planId: plan.id } });
          await tx.planModule.deleteMany({ where: { planId: plan.id } });
          await tx.planLimit.deleteMany({ where: { planId: plan.id } });

          if (plan.features.length > 0)
            await tx.planFeature.createMany({
              data: plan.features.map((featureKey) => ({ tenantId, planId: plan.id, featureKey })),
            });
          if (plan.modules.length > 0)
            await tx.planModule.createMany({
              data: plan.modules.map((moduleKey) => ({ tenantId, planId: plan.id, moduleKey })),
            });
          if (plan.limits.length > 0)
            await tx.planLimit.createMany({
              data: plan.limits.map((l) => ({ tenantId, planId: plan.id, limitKey: l.limitKey, limit: l.limit })),
            });
        });
        updated++;
      } else {
        await prisma.plan.create({
          data: {
            id: plan.id,
            tenantId,
            name: plan.name,
            description: plan.description,
            currency: "PEN",
            priceMonthly: plan.priceMonthly,
            priceYearly: plan.priceYearly,
            isActive: true,
            sortOrder: plan.sortOrder,
            features: {
              create: plan.features.map((featureKey) => ({ tenantId, featureKey })),
            },
            modules: {
              create: plan.modules.map((moduleKey) => ({ tenantId, moduleKey })),
            },
            limits: {
              create: plan.limits.map((l) => ({ tenantId, limitKey: l.limitKey, limit: l.limit })),
            },
          },
        });
        seeded++;
      }
    } catch (err) {
      console.warn(`  ⚠️  Plan ${plan.id}:`, (err as Error).message.split("\n")[0]);
    }
  }

  console.log(`  ✅ ${seeded} plans created, ${updated} plans updated (${plans.length} total)`);
}


async function main() {
  await seedSystemPermissions();
  await seedSuperAdmin();
  await seedPlans();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
