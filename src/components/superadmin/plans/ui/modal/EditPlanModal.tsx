// src/components/billing/plans/EditPlanModal.tsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plan } from "@/src/types/plan/planSchema";
import {
  PLAN_FEATURE_KEYS,
  PlanFeatureKey,
} from "@/src/types/plan/planFeature";
import {
  PLAN_LIMIT_KEYS,
  PlanLimitKey,
} from "@/src/types/plan/type.planLimitKey";

const editPlanSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  priceMonthly: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  priceYearly: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  trialDays: z
    .number()
    .min(0, "Los días de prueba deben ser mayor o igual a 0")
    .optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  currency: z.string().default("PEN"),
});

type EditPlanForm = z.infer<typeof editPlanSchema>;

interface EditPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: (Plan & { features?: any[]; limits?: any[] }) | null;
  onSuccess?: () => void;
}

export const EditPlanModal: React.FC<EditPlanModalProps> = ({
  open,
  onOpenChange,
  plan,
  onSuccess,
}) => {
  const [selectedFeatures, setSelectedFeatures] = useState<Set<PlanFeatureKey>>(
    new Set(),
  );
  const [limits, setLimits] = useState<Partial<Record<PlanLimitKey, number>>>(
    {},
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EditPlanForm>({
    resolver: zodResolver(editPlanSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      priceMonthly: 0,
      priceYearly: 0,
      trialDays: 0,
      sortOrder: 0,
      isActive: true,
      currency: "PEN",
    },
  });

  // Cargar datos del plan cuando se abre el modal
  useEffect(() => {
    if (plan && open) {
      setValue("name", plan.name);
      setValue("description", plan.description || "");
      setValue("priceMonthly", plan.priceMonthly);
      setValue("priceYearly", plan.priceYearly || 0);
      setValue("sortOrder", plan.sortOrder);
      setValue("isActive", plan.isActive);
      setValue("currency", plan.currency);

      // Cargar features del plan
      const planFeatures = (plan.features || []).map((f: any) => f.featureKey);
      setSelectedFeatures(new Set(planFeatures as PlanFeatureKey[]));

      // Cargar límites del plan
      const planLimits = (plan.limits || []).reduce(
        (acc: any, curr: any) => ({
          ...acc,
          [curr.limitKey]: curr.limit,
        }),
        {},
      );
      setLimits(planLimits);
    }
  }, [plan, open, setValue]);

  const onSubmit = async (data: EditPlanForm) => {
    try {
      // Aquí iría la llamada a la API para actualizar el plan
      console.log("Actualizar plan:", {
        ...data,
        features: Array.from(selectedFeatures),
        limits,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al actualizar plan:", error);
    }
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

  const updateLimit = (key: PlanLimitKey, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    setLimits((prev) => ({ ...prev, [key]: isNaN(numValue) ? 0 : numValue }));
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Plan: {plan.name}</DialogTitle>
          <DialogDescription>
            Modifica los detalles del plan, características y límites.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="features">Características</TabsTrigger>
              <TabsTrigger value="limits">Límites</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Plan *</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Orden</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    {...register("sortOrder", { valueAsNumber: true })}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input id="description" {...register("description")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceMonthly">Precio Mensual (S/) *</Label>
                  <Input
                    id="priceMonthly"
                    type="number"
                    step="0.01"
                    {...register("priceMonthly", { valueAsNumber: true })}
                  />
                  {errors.priceMonthly && (
                    <p className="text-sm text-red-500">
                      {errors.priceMonthly.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceYearly">Precio Anual (S/) *</Label>
                  <Input
                    id="priceYearly"
                    type="number"
                    step="0.01"
                    {...register("priceYearly", { valueAsNumber: true })}
                  />
                  {errors.priceYearly && (
                    <p className="text-sm text-red-500">
                      {errors.priceYearly.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trialDays">Días de Prueba</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    {...register("trialDays", { valueAsNumber: true })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    {...register("isActive")}
                    checked={plan.isActive}
                  />
                  <Label htmlFor="isActive">Plan Activo</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            </TabsContent>

            <TabsContent value="limits" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {PLAN_LIMIT_KEYS.map((limitKey) => (
                  <div key={limitKey} className="space-y-2">
                    <Label htmlFor={`limit-${limitKey}`} className="capitalize">
                      {limitKey.replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                    <Input
                      id={`limit-${limitKey}`}
                      type="number"
                      value={limits[limitKey] ?? ""}
                      onChange={(e) => updateLimit(limitKey, e.target.value)}
                      placeholder="-1 = Ilimitado, 0 = Bloqueado"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
