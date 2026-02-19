import z from "zod";

// type.attribute.ts
export const modelSchema = z.object({
  id: z.string(),
  name: z.string(), // "Pitillo", "Slim Fit",
  code: z.string(),
  isActive: z.boolean(),
});

export type Model = z.infer<typeof modelSchema>;