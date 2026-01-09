import z from "zod"

export const branchSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  status: z.enum(["active", "inactive"]), // Cambiado a enum para consistencia
});

export type Branch = z.infer<typeof branchSchema>