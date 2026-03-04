import z from "zod";

export const userAttendanceSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  branchId: z.string(),
  userId: z.string(), // vinculado al usuario
  shiftId: z.string(), // vinculado al turno
  checkIn: z.date(), // cuándo entró
  checkOut: z.date().optional(), // cuándo salió, puede ser null si aún no sale
  notes: z.string().optional(), // comentarios (tarde, licencia, etc.)
  createdBy: z.string().optional(),
  status: z.enum(["present", "late", "absent", "justified"]),
  source: z.enum(["self", "admin", "barcode"]),
  lateMinutes: z.number().default(0),
  extraMinutes: z.number().default(0),
  workDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type UserAttendance = z.infer<typeof userAttendanceSchema>;
