import z from "zod";

// type.attribute.ts
export const modelSchema = z.object({
  id: z.string(),
  name: z.string(), // "Pitillo", "Slim Fit",
  code: z.string(),
  isActive: z.boolean().default(true),

  metadata: z.record(z.string(), z.any()).optional(),
});

export type Model = z.infer<typeof modelSchema>;