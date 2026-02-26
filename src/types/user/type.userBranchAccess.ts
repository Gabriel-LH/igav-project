import z from "zod";

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
