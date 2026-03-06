// src/components/billing/subscriptions/CancelSubscriptionModal.tsx
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
import { TenantSubscription } from "@/src/types/tenant/tenantSuscription";

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: TenantSubscription | null;
  onSuccess?: () => void;
}

export const CancelSubscriptionModal: React.FC<
  CancelSubscriptionModalProps
> = ({ open, onOpenChange, subscription, onSuccess }) => {
  const handleConfirm = async () => {
    console.log("Cancelar suscripción:", subscription?.id);
    onSuccess?.();
    onOpenChange(false);
  };

  if (!subscription) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El tenant perderá acceso a las
            funcionalidades del plan al finalizar el período actual.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, mantener</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 hover:bg-red-700">
            Sí, cancelar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
