import { BusinessRules } from "@/src/types/bussines-rules/bussines-rules";

export const BUSINESS_RULES_MOCK: BusinessRules = {
  defaultTransferTime: 2, // 2 días por defecto de transferencia de una  sucursal a otra
  penaltyPerDay: 15.00,   // $15 por día de retraso
  stainPenalty: 25.00,
  lostButtonPenalty: 5.00,
  lostHangerPenalty: 2.00,
  currency: "PEN",
  taxRate: 0.18,
  
  transferRoutes: [
    {
      originBranchId: "branch-001",
      destinationBranchId: "branch-002",
      estimatedTime: 1 // Entre estas sedes solo tarda 1 día
    },
    {
      originBranchId: "branch-002",
      destinationBranchId: "branch-003",
      estimatedTime: 4 // Entrega interprovincial tarda más
    }
  ]
};