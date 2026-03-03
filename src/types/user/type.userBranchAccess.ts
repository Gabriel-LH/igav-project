import z from "zod";

// Define:

// “En qué sucursales puede trabajar y con qué rol en cada una.”

// Es un override contextual.

export const userBranchAccessSchema = z.object({
  id: z.string(),

  userId: z.string(),
  tenantId: z.string(),
  branchId: z.string(),

  roleOverride: z.enum(["owner", "admin", "gerente", "vendedor"]).optional(),

  isPrimary: z.boolean().default(false),

  status: z.enum(["active", "inactive"]).default("active"),

  createdAt: z.date(),
});

export type UserBranchAccess = z.infer<typeof userBranchAccessSchema>;

// Caso real en tu sistema

// Supongamos:

// Empresa tiene:

// Sucursal Centro

// Sucursal Norte

// Sucursal Sur

// Usuario: María

// Es EMPLOYEE del tenant

// Pero solo puede trabajar en Sucursal Norte

// Entonces:

// UserTenantMembership
//   role = EMPLOYEE

// UserBranchAccess
//   branchId = Norte
//   isPrimary = true

// Sin UserBranchAccess, María podría operar en todas las sucursales.

// 📌 Para qué sirve roleOverride

// Ejemplo:

// Globalmente es EMPLOYEE

// Pero en Sucursal Centro es GERENTE

// Entonces:

// Membership.role = EMPLOYEE
// BranchAccess.roleOverride = GERENTE

// Eso te permite jerarquía contextual.

// 🧩 Cuándo realmente necesitas este modelo

// Lo necesitas si:

// ✔ Un empleado puede trabajar en varias sucursales
// ✔ Un empleado tiene roles distintos según sucursal
// ✔ Necesitas restringir caja por sucursal
// ✔ Necesitas reportes por sucursal
// ✔ Necesitas permisos diferenciados por ubicación

// Si tu sistema solo tiene 1 sucursal → es innecesario.

// ⚠️ Lo que debes validar

// Debe existir:

// UNIQUE (userId, branchId)

// Para evitar duplicados.

// Y siempre validar:

// Que tenga Membership activa

// Que tenga BranchAccess activa
