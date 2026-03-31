import z from "zod";

export const branchSchema = z.object({
  id: z.string(),
  tenantId: z.string(),

  code: z.string(), // identificador interno

  name: z.string(),
  city: z.string(),
  address: z.string(),

  phone: z.string().optional(),
  email: z.string().optional(),

  timezone: z.string().default("America/Lima"),

  isPrimary: z.boolean().default(false),

  status: z.enum(["active", "inactive"]).default("active"),

  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),

  metadata: z.record(z.string(), z.any()).optional(),
  config: z.any().optional(), // Using any to avoid circular dependencies if any, but will be BranchConfig
});

export type Branch = z.infer<typeof branchSchema>;
