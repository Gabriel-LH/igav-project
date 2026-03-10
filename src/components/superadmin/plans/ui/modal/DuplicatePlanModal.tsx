// src/components/plans/DuplicatePlanModal.tsx
import React, { useEffect } from "react";
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
import { Plan } from "@/src/types/plan/planSchema";

const duplicatePlanSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  sortOrder: z.number(),
  isActive: z.boolean(),
  currency: z.string(),
});

type DuplicatePlanForm = z.infer<typeof duplicatePlanSchema>;

interface DuplicatePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onSuccess?: () => void;
}

export const DuplicatePlanModal: React.FC<DuplicatePlanModalProps> = ({
  open,
  onOpenChange,
  plan,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<DuplicatePlanForm>({
    resolver: zodResolver(duplicatePlanSchema),
  });

  useEffect(() => {
    if (plan && open) {
      setValue("name", `${plan.name} (copia)`);
    }
  }, [plan, open, setValue]);

  const onSubmit = async (data: DuplicatePlanForm) => {
    try {
      // Aquí iría la llamada a la API para duplicar el plan
      console.log("Duplicar plan:", { ...data, originalPlanId: plan?.id });

      reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al duplicar plan:", error);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar Plan: {plan.name}</DialogTitle>
          <DialogDescription>
            Crea una copia del plan con todas sus características y límites.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Nuevo Plan *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ej: Pro - Ventas (copia)"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Duplicar Plan</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
