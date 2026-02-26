import z from "zod";

export const CreateRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()),
});
