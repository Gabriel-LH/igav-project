// src/components/billing/subscriptions/CreateSubscriptionModal.tsx
"use client";

import React, { useMemo, useState } from "react";
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
import { Tenant } from "@/src/types/tenant/type.tenant";
import { Plan } from "@/src/types/plan/planSchema";
import { assignPlan } from "@/src/app/(superadmin)/superadmin/actions/tenant.actions";
import { toast } from "sonner";

type BillingCycle = "monthly" | "yearly";

interface CreateSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenants: Tenant[];
  plans: Plan[];
  onSuccess?: () => void;
}

export const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({
  open,
  onOpenChange,
  tenants,
  plans,
  onSuccess,
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedTenants = useMemo(() => {
    return [...tenants].sort((a, b) => a.name.localeCompare(b.name));
  }, [tenants]);

  const handleCreate = async () => {
    if (!selectedTenantId || !selectedPlanId) {
      toast.error("Selecciona un tenant y un plan");
      return;
    }

    setIsSubmitting(true);
    try {
      await assignPlan(selectedTenantId, selectedPlanId, billingCycle);
      toast.success("Suscripcion creada correctamente");
      onSuccess?.();
      onOpenChange(false);
      setSelectedTenantId("");
      setSelectedPlanId("");
      setBillingCycle("monthly");
    } catch (error) {
      console.error(error);
      toast.error("Error al crear la suscripcion");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Suscripcion</DialogTitle>
          <DialogDescription>
            Selecciona el tenant, plan y ciclo de facturacion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tenant</Label>
            <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tenant" />
              </SelectTrigger>
              <SelectContent>
                {sortedTenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label>Ciclo de Facturacion</Label>
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
          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
