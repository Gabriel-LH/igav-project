import z from "zod";
import { PlanFeatureKeySchema } from "../plan/planFeature";

export const moduleFeatureSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  featureKey: PlanFeatureKeySchema
});

export type ModuleFeature = z.infer<typeof moduleFeatureSchema>