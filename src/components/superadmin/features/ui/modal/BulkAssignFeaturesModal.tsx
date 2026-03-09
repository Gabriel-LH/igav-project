// src/components/billing/features/BulkAssignFeaturesModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PLAN_FEATURE_KEYS,
  PlanFeatureKey,
} from "@/src/types/plan/planFeature";

import { Plan } from "@/src/types/plan/planSchema";

interface BulkAssignFeaturesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  plans: Plan[];
}

export function BulkAssignFeaturesModal({
  open,
  onOpenChange,
  onSuccess,
  plans,
}: BulkAssignFeaturesModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedFeatures, setSelectedFeatures] = useState<Set<PlanFeatureKey>>(
    new Set(),
  );

  const handleSubmit = () => {
    console.log("Asignar features en bulk:", {
      planId: selectedPlan,
      features: Array.from(selectedFeatures),
    });
    onSuccess?.();
    onOpenChange(false);
  };

  const toggleFeature = (feature: PlanFeatureKey) => {
    const newFeatures = new Set(selectedFeatures);
    if (newFeatures.has(feature)) {
      newFeatures.delete(feature);
    } else {
      newFeatures.add(feature);
    }
    setSelectedFeatures(newFeatures);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Múltiples Features</DialogTitle>
          <DialogDescription>
            Selecciona un plan y las features que deseas asignar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Plan *</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlan && (
            <>
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto p-2 border rounded-lg">
                  {PLAN_FEATURE_KEYS.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={`feature-${feature}`}
                        checked={selectedFeatures.has(feature)}
                        onCheckedChange={() => toggleFeature(feature)}
                      />
                      <Label
                        htmlFor={`feature-${feature}`}
                        className="capitalize"
                      >
                        {feature.replace(/([A-Z])/g, " $1").trim()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedFeatures.size} features seleccionadas
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedFeatures.size === PLAN_FEATURE_KEYS.length) {
                        setSelectedFeatures(new Set());
                      } else {
                        setSelectedFeatures(new Set(PLAN_FEATURE_KEYS));
                      }
                    }}
                  >
                    {selectedFeatures.size === PLAN_FEATURE_KEYS.length
                      ? "Deseleccionar todas"
                      : "Seleccionar todas"}
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedPlan}>
              Asignar Features
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
