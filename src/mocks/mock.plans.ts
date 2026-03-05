import { Plan } from "../types/plan/planSchema";
import { getPlanMatrixData } from "./mock.planMatrix";

export const PLANS_MOCK: Plan[] = getPlanMatrixData().map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  currency: "PEN",
  priceMonthly: p.priceMonthly,
  priceYearly: p.priceYearly,
  isActive: true,
  sortOrder: p.sortOrder,
  createdAt: new Date(),
}));
