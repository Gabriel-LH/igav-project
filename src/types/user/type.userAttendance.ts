import z from "zod";

export const userAttendanceSchema = z.object({
  id: z.string(),
  userId: z.string(), // vinculado al usuario
  checkIn: z.date(), // cuándo entró
  checkOut: z.date().optional(), // cuándo salió, puede ser null si aún no sale
  notes: z.string().optional(), // comentarios (tarde, licencia, etc.)
  createdBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type UserAttendance = z.infer<typeof userAttendanceSchema>;
