import { z } from "zod";

export const clientInactiveSchema = z.object({
  id: z.string(),
  userName: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  dni: z.string(),
  email: z.string().optional(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  province: z.string().optional(),
  zipCode: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
  status: z.enum(["active", "inactive"]),
});