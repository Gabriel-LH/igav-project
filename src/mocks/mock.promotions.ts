// src/mocks/mock.promotions.ts

import { Promotion } from "../types/promotion/type.promotion";

export const PROMOTIONS_MOCK: Promotion[] = [
  {
    id: "PROMO-VERANO-001",
    name: "Liquidación Verano",
    type: "percentage" as const,
    value: 20, // 20% de descuento
    scope: "category" as const,
    targetIds: ["CAT-TERNOS", "CAT-CAMISAS"],
    isActive: true,
    isExclusive: false,
    startDate: new Date("2026-02-19"),
    endDate: new Date("2026-03-31"),
    createdAt: new Date(),
    usedCount: 4,
    combinable: false,
    appliesTo: ["alquiler"]
  },
  {
    id: "PROMO-FIJA-002",
    name: "Bono Amigo S/ 50",
    type: "fixed_amount" as const,
    value: 50, // S/ 50.00 exactos
    scope: "global" as const,
    targetIds: [],
    isActive: true,
    isExclusive: true,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
    createdAt: new Date(),
    usedCount: 10,
    combinable: false,
    appliesTo: ["venta", "alquiler"]
  },
  {
    id: "BUNDLE-ALQUILER-ELEGANTE-001",
    name: "Pack Traje Elegante",
    type: "bundle" as const,
    value: 30,
    scope: "pack" as const,
    isExclusive: true,
    appliesTo: ["alquiler"],
    bundleConfig: {
      requiredProductIds: ["6", "5", "4", "7"],
      bundlePrice: 90,
      prorateStrategy: "proportional",
    },
    isActive: true,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
    createdAt: new Date(),
    usedCount: 0,
    combinable: false,
  },
];
