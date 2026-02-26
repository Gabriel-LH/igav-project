import { z } from "zod";

const ModuleEnum = z.enum([
  "sales",
  "rentals",
  "inventory",
  "users",
  "roles",
  "tenants",
  "branches",
  "clients",
  "products",
  "promotions",
  "referrals",
  "payments",
  "referralRewards",
  "userAttendance",
  "userBranchAccess",
  "userTenantMembership",
  "permissions",
  "reservations",
]);

export const PermissionSchema = z.object({
  id: z.string(),
  key: z.string().min(3), // "sales.create"
  module: ModuleEnum,
  description: z.string().optional(),
  createdAt: z.date(),
});

export type Permission = z.infer<typeof PermissionSchema>;
