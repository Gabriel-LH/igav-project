import z from "zod";

export const shiftSchema = z.object({
  id: z.string(),
  tenantId: z.string(),

  name: z.string(),
  startTime: z.string(), // "08:00"
  endTime: z.string(),   // "17:00"

  toleranceMinutes: z.number().default(0),
  workingDays: z.array(z.number()),

  status: z.enum(["active", "inactive"]).default("active"),

  createdAt: z.date(),
});

export type Shift = z.infer<typeof shiftSchema>;