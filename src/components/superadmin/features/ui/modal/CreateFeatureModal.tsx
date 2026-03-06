// src/components/billing/features/CreateFeatureModal.tsx
import React from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAN_FEATURE_KEYS } from "@/src/types/plan/planFeature";
import { PLANS_MOCK } from "@/src/mocks/mock.plans";

const createFeatureSchema = z.object({
  featureKey: z.string().min(1, "La feature es requerida"),
  planId: z.string().min(1, "El plan es requerido"),
  isActive: z.boolean().default(true),
});

type CreateFeatureForm = z.infer<typeof createFeatureSchema>;

interface CreateFeatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateFeatureModal: React.FC<CreateFeatureModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateFeatureForm>({
    resolver: zodResolver(createFeatureSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const onSubmit = async (data: CreateFeatureForm) => {
    try {
      console.log("Crear feature:", data);
      reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al crear feature:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Feature a Plan</DialogTitle>
          <DialogDescription>
            Selecciona la feature y el plan al que deseas asignarla.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="featureKey">Feature *</Label>
            <Select onValueChange={(value) => setValue("featureKey", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una feature" />
              </SelectTrigger>
              <SelectContent>
                {PLAN_FEATURE_KEYS.map((feature) => (
                  <SelectItem key={feature} value={feature}>
                    {feature.replace(/([A-Z])/g, " $1").trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.featureKey && (
              <p className="text-sm text-red-500">
                {errors.featureKey.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="planId">Plan *</Label>
            <Select onValueChange={(value) => setValue("planId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                {PLANS_MOCK.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.planId && (
              <p className="text-sm text-red-500">{errors.planId.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="isActive" {...register("isActive")} defaultChecked />
            <Label htmlFor="isActive">Activo</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Asignar Feature</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
