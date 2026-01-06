import { z } from "zod";

export const popularSchema = z.object({
    id: z.number(),
    name: z.string(),
    type: z.string(),
    count: z.number(),
    income: z.number(),
});