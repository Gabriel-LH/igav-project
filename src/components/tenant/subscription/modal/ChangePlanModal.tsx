// components/subscription/modals/change-plan-modal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { PlanWithFeatures } from "@/src/adapters/subscription-adapter";
import { formatCurrency } from "@/src/utils/currency-format";

interface ChangePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: PlanWithFeatures[];
  selectedPlanId: string | null;
  currentPlanId?: string;
  onConfirm: (planId: string, cycle: "monthly" | "yearly") => void;
}

export function ChangePlanModal({
  open,
  onOpenChange,
  plans,
  selectedPlanId,
  currentPlanId,
  onConfirm,
}: ChangePlanModalProps) {
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [planId, setPlanId] = useState<string>(selectedPlanId || "");

  const selectedPlan = plans.find((p) => p.id === planId);
  const isDowngrade =
    selectedPlan &&
    currentPlanId &&
    plans.findIndex((p) => p.id === currentPlanId) >
      plans.findIndex((p) => p.id === planId);

  const getPrice = () => {
    if (!selectedPlan) return 0;
    return selectedCycle === "monthly"
      ? selectedPlan.priceMonthly
      : selectedPlan.priceYearly || selectedPlan.priceMonthly * 10;
  };

  const handleConfirm = () => {
    if (planId) {
      onConfirm(planId, selectedCycle);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-dvh sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cambiar plan</DialogTitle>
          <DialogDescription>
            Selecciona el nuevo plan y ciclo de facturación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto">
          {/* Selección de plan */}
          <RadioGroup
            value={planId}
            onValueChange={setPlanId}
            className="space-y-3"
          >
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-start space-x-3">
                <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                <Label htmlFor={plan.id} className="flex-1 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>
                    {plan.id === currentPlanId && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        Actual
                      </span>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Separator />

          {/* Selección de ciclo */}
          {selectedPlan && (
            <div className="space-y-3">
              <Label>Ciclo de facturación</Label>
              <RadioGroup
                value={selectedCycle}
                onValueChange={(v) =>
                  setSelectedCycle(v as "monthly" | "yearly")
                }
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="monthly"
                    id="monthly"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="monthly"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="text-lg font-bold">
                      {formatCurrency(selectedPlan.priceMonthly)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      por mes
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="yearly"
                    id="yearly"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="yearly"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="text-lg font-bold">
                      {formatCurrency(
                        selectedPlan.priceYearly ||
                          selectedPlan.priceMonthly * 10,
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      por año
                    </span>
                    {selectedPlan.priceYearly && (
                      <span className="text-xs text-green-600 mt-1">
                        Ahorras{" "}
                        {formatCurrency(
                          selectedPlan.priceMonthly * 12 -
                            selectedPlan.priceYearly,
                        )}
                      </span>
                    )}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Resumen */}
          {selectedPlan && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Plan seleccionado:
                </span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ciclo:</span>
                <span className="font-medium capitalize">{selectedCycle}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary">
                  {formatCurrency(getPrice())}
                </span>
              </div>
            </div>
          )}

          {/* Advertencia por downgrade */}
          {isDowngrade && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Estás por cambiar a un plan inferior. Algunas funcionalidades
                podrían verse limitadas.
              </AlertDescription>
            </Alert>
          )}

          {/* Features del plan seleccionado */}
          {selectedPlan && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Este plan incluye:</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedPlan.features).map(
                  ([key, enabled]) =>
                    enabled && (
                      <div
                        key={key}
                        className="flex items-center gap-1 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{key}</span>
                      </div>
                    ),
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!planId}>
            Confirmar cambio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
