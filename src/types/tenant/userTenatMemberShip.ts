import z from "zod";

export const userTenantMembershipSchema = z.object({
  id: z.string(),

  userId: z.string(),
  tenantId: z.string(),

  roleId: z.string(),

  defaultBranchId: z.string().optional(),

  status: z.enum(["active", "invited", "suspended"]).default("active"),

  invitedBy: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserTenantMembership = z.infer<typeof userTenantMembershipSchema>;
