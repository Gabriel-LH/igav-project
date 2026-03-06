// src/components/billing/features/CreateLimitModal.tsx
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PLAN_LIMIT_KEYS,
  PlanLimitKey,
} from "@/src/types/plan/type.planLimitKey";
import { PLANS_MOCK } from "@/src/mocks/mock.plans";

const createLimitSchema = z.object({
  limitKey: z.string().min(1, "El límite es requerido"),
  planId: z.string().min(1, "El plan es requerido"),
  limit: z.number().min(-1, "El límite debe ser mayor o igual a -1"),
});

type CreateLimitForm = z.infer<typeof createLimitSchema>;

interface CreateLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateLimitModal: React.FC<CreateLimitModalProps> = ({
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
  } = useForm<CreateLimitForm>({
    resolver: zodResolver(createLimitSchema),
    defaultValues: {
      limit: 0,
    },
  });

  const onSubmit = async (data: CreateLimitForm) => {
    try {
      console.log("Crear límite:", data);
      reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al crear límite:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Límite para Plan</DialogTitle>
          <DialogDescription>
            Define el límite para un plan específico.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="limitKey">Tipo de Límite *</Label>
            <Select
              onValueChange={(value) =>
                setValue("limitKey", value as PlanLimitKey)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo de límite" />
              </SelectTrigger>
              <SelectContent>
                {PLAN_LIMIT_KEYS.map((limitKey) => (
                  <SelectItem key={limitKey} value={limitKey}>
                    {limitKey.replace(/([A-Z])/g, " $1").trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.limitKey && (
              <p className="text-sm text-red-500">{errors.limitKey.message}</p>
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

          <div className="space-y-2">
            <Label htmlFor="limit">Valor del Límite *</Label>
            <Input
              id="limit"
              type="number"
              {...register("limit", { valueAsNumber: true })}
              placeholder="-1 = Ilimitado, 0 = Bloqueado"
            />
            {errors.limit && (
              <p className="text-sm text-red-500">{errors.limit.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Usa -1 para ilimitado, 0 para bloqueado
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Guardar Límite</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
