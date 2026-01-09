import z from "zod"

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "vendedor", "gerente"]),
  branchId: z.string(), // El local donde trabaja este usuario
  status: z.enum(["active", "inactive"]),
});

export type User = z.infer<typeof userSchema>
