import z from "zod";

export const userShiftAssignmentSchema = z.object({
  id: z.string(),
  membershipId: z.string(), // clave

  shiftId: z.string(),

  startDate: z.date(),
  endDate: z.date().optional(),

  createdAt: z.date(),
});

export type UserShiftAssignment = z.infer<typeof userShiftAssignmentSchema>;
