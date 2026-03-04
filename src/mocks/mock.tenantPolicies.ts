// data/mockTenantPolicies.ts
import { TenantPolicies } from "../types/tenant/type.tenantPolicies";
import { PolicyFieldMetadata } from "../application/interfaces/policies/PolicyImpact";

export const MOCK_TENANT_POLICIES: TenantPolicies = {
  tenantId: "tenant-1",
  sales: {
    allowReturns: true,
    maxReturnDays: 7,
    allowPriceEdit: true,
    requireReasonForCancel: true,
    autoCompleteDelivery: false,
  },
  rentals: {
    allowLateReturn: true,
    lateToleranceHours: 2,
    autoMarkAsLate: true,
    requireGuarantee: true,
    allowRentalWithoutStockAssigned: false,
    autoMoveToLaundryOnReturn: true,
    autoMoveToMaintenanceIfDamaged: true,
  },
  reservations: {
    autoExpireReservations: true,
    expireAfterHours: 24,
    allowOverbooking: false,
    requireDeposit: false,
    autoConvertOnPickup: true,
  },
  inventory: {
    allowManualAdjustments: true,
    requireReasonForAdjustment: true,
    autoBlockStockIfReserved: true,
  },
  financial: {
    allowNegativeBalance: false,
    autoApplyChargesOnDamage: true,
  },
  security: {
    requirePinForHighDiscount: true,
    requirePinForCancelOperation: false,
    requirePinForManualPriceEdit: true,
  },
  updatedAt: new Date("2024-03-01"),
};

// Metadatos para tooltips e impactos
export const POLICY_METADATA: Record<string, PolicyFieldMetadata> = {
  "rentals.autoMarkAsLate": {
    label: "Marcar automáticamente como atrasado",
    description: "Los alquileres se marcan como atrasados automáticamente",
    impact: "high",
    impactMessage: "🔴 Impacto crítico: Afecta estados y cargos automáticos",
  },
  "rentals.autoMoveToLaundryOnReturn": {
    label: "Mover automáticamente a lavandería",
    description: "Productos devueltos pasan directamente a lavandería",
    impact: "medium",
    impactMessage: "🟡 Impacto operativo: Automatiza flujo de trabajo",
  },
  "inventory.autoBlockStockIfReserved": {
    label: "Bloquear stock si está reservado",
    description: "Stock reservado no disponible para otras transacciones",
    impact: "high",
    impactMessage: "🔴 Impacto crítico: Afecta disponibilidad de inventario",
  },
  "financial.autoApplyChargesOnDamage": {
    label: "Aplicar cargos automáticos por daño",
    description: "Genera cargos automáticos cuando se reporta daño",
    impact: "high",
    impactMessage: "🔴 Impacto crítico: Genera cargos financieros automáticos",
  },
};
