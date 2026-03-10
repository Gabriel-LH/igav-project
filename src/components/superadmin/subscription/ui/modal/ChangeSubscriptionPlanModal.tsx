// src/components/superadmin/subscription/ui/modal/ChangeSubscriptionPlanModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TenantSubscription } from "@/src/types/tenant/tenantSuscription";
import { Plan } from "@/src/types/plan/planSchema";
import { BillingCycle } from "@prisma/client";
import { changeTenantPlan } from "@/src/app/(superadmin)/superadmin/actions/tenant.actions";
import { toast } from "sonner";

interface ChangeSubscriptionPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: TenantSubscription | null;
  plans: Plan[];
  onSuccess?: () => void;
}

export const ChangeSubscriptionPlanModal: React.FC<
  ChangeSubscriptionPlanModalProps
> = ({ open, onOpenChange, subscription, plans, onSuccess }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subscription) {
      setSelectedPlanId(subscription.planId);
      setBillingCycle(subscription.billingCycle as BillingCycle);
    }
  }, [subscription]);

  const handleChangePlan = async () => {
    if (!subscription || !selectedPlanId) {
      toast.error("Selecciona un plan");
      return;
    }

    setIsSubmitting(true);
    try {
      await changeTenantPlan(subscription.tenantId, selectedPlanId, billingCycle);
      toast.success("Plan actualizado correctamente");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar el plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar plan</DialogTitle>
          <DialogDescription>
            Selecciona el nuevo plan y el ciclo de facturación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - S/ {Number(plan.priceMonthly).toFixed(2)} / mes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ciclo de Facturación</Label>
            <Select
              value={billingCycle}
              onValueChange={(val) => setBillingCycle(val as BillingCycle)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona ciclo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleChangePlan} disabled={isSubmitting}>
            {isSubmitting ? "Actualizando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
