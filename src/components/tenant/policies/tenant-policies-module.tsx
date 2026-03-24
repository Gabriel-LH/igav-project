"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw,} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PolicyConfigForm } from "./policy-config-form";
import {
  getActivePolicyAction,
  upsertPolicyAction,
} from "@/src/app/(tenant)/tenant/actions/settings.actions";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon } from "@hugeicons/core-free-icons";

export function TenantPoliciesModule() {
  const [policy, setPolicy] = useState<TenantPolicy | null>(null);
  const [originalPolicy, setOriginalPolicy] = useState<TenantPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getActivePolicyAction();
        if (res.success && res.data) {
          setPolicy(res.data);
          setOriginalPolicy(res.data);
        } else {
          const defPolicy: TenantPolicy = {
              id: "default",
              tenantId: "default",
              version: 1,
              isActive: true,
              createdAt: new Date(),
              updatedBy: "system",
              sales: { allowReturns: true, maxReturnDays: 30, requireOriginalTicket: true, allowPartialReturns: true },
              rentals: { 
                  allowLateReturn: true, 
                  lateToleranceHours: 2, 
                  lateFeeType: "fixed" as any, 
                  lateFeeValue: 0, 
                  defaultRentalDurationDays: 3, 
                  minRentalDurationDays: 1, 
                  requireGuarantee: true, 
                  inclusiveDayCalculation: true,
                  autoMarkAsLate: true,
                  allowRentalWithoutStockAssigned: false,
                  autoMoveToLaundryOnReturn: true,
                  autoMoveToMaintenanceIfDamaged: true,
                  defaultLaundryDays: 2,
                  defaultMaintenanceDays: 1
              },
              reservations: { autoExpireReservations: true, expireAfterHours: 24, requireDownPayment: false, minDownPaymentPercentage: 0 },
              inventory: { allowManualAdjustments: true, requireReasonForAdjustment: true, autoOrderThreshold: 5, autoBlockStockIfReserved: true },
              financial: { allowNegativeBalance: false, maxCreditPerClient: 0, allowInstallments: false, autoApplyChargesOnDamage: true },
              security: { requirePinForHighDiscount: true, highDiscountThreshold: 20, requireManagerApprovalForVoid: true }
          };
          setPolicy(defPolicy);
          setOriginalPolicy(defPolicy);
        }
      } catch (error) {
          console.error("Error loading policies:", error);
      } finally {
          setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!policy || !originalPolicy) return;
    const changed = JSON.stringify(policy) !== JSON.stringify(originalPolicy);
    setHasUnsavedChanges(changed);
  }, [policy, originalPolicy]);

  const handlePolicyChange = (section: keyof TenantPolicy, values: any) => {
    if (!policy) return;
    setPolicy({
      ...policy,
      [section]: {
        ...(policy[section] as any),
        ...values,
      },
    });
  };

  const handleSave = async () => {
    if (!policy) return;
    setIsSaving(true);
    try {
        const res = await upsertPolicyAction(policy, "Actualización manual de políticas");
        if (res.success) {
          toast.success("Políticas actualizadas correctamente");
          setOriginalPolicy(policy);
          setHasUnsavedChanges(false);
        } else {
          toast.error("Error al guardar políticas: " + res.error);
        }
    } catch (error) {
        toast.error("Error de conexión al guardar políticas");
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPolicy(originalPolicy);
  };

  if (isLoading) {
    return <div className="p-12 text-center animate-pulse text-muted-foreground">Cargando políticas del sistema...</div>;
  }

  if (!policy) return null;

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <HugeiconsIcon icon={File02Icon} className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Configuración de Políticas</h2>
                    <p className="text-sm text-muted-foreground">Define las reglas de negocio globales para el tenant</p>
                </div>
            </div>
            {hasUnsavedChanges && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Descartar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Guardando..." : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>
            )}
       </div>

       <PolicyConfigForm policy={policy} onChange={handlePolicyChange} />
    </div>
  );
}