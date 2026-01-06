import { z } from "zod";

export const tradingSchema = z.object({
    id: z.number(),
    item: z.string(),
    lastweek: z.number(),
    thisweek: z.number(),
    difference: z.number(),
});