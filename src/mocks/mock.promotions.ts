// src/mocks/mock.promotions.ts

import { Promotion } from "../types/promotion/type.promotion"

export const PROMOTIONS_MOCK: Promotion[] = [
  {
      id: "PROMO-VERANO-001",
      name: "Liquidación Verano",
      type: "percentage" as const, // Puede ser "percentage" o "fixed"
      value: 20, // 20% de descuento
      scope: "category" as const, // global | category | product
      targetIds: ["cat-ternos", "cat-camisas"], // IDs de categorías a las que aplica
      isActive: true,
      startDate: new Date("2026-02-19"),
      endDate: new Date("2026-03-31"),
      createdAt: new Date()
  },
  {
      id: "PROMO-FIJA-002",
      name: "Bono Amigo S/ 50",
      type: "fixed_amount" as const,
      value: 50, // S/ 50.00 exactos
      scope: "global" as const,
      targetIds: [],
      isActive: true,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      createdAt: new Date()
  }
];