// src/components/plans/ChangePlanStatusModal.tsx
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plan } from "@/src/types/plan/planSchema";

interface ChangePlanStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onSuccess?: () => void;
}

export const ChangePlanStatusModal: React.FC<ChangePlanStatusModalProps> = ({
  open,
  onOpenChange,
  plan,
  onSuccess,
}) => {
  const handleConfirm = async () => {
    try {
      // Aquí iría la llamada a la API para cambiar el estado
      console.log("Cambiar estado del plan:", {
        planId: plan?.id,
        newStatus: !plan?.isActive,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al cambiar estado del plan:", error);
    }
  };

  if (!plan) return null;

  const newStatus = plan.isActive ? "inactivar" : "activar";
  const description = plan.isActive
    ? "Al inactivar este plan, los tenants no podrán seleccionarlo para nuevas suscripciones. Los tenants actuales mantendrán su plan hasta que lo cambien o renueven."
    : "Al activar este plan, estará disponible para que los tenants puedan seleccionarlo.";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {plan.isActive ? "¿Inactivar plan?" : "¿Activar plan?"}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {plan.isActive ? "Inactivar" : "Activar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
