// src/components/inventory/assignment/CloseAssignmentModal.tsx
import React from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface CloseAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingCount: number;
  onConfirm: (action: "mark-lost" | "keep-transit") => void;
}

export const CloseReceiveModal: React.FC<CloseAssignmentModalProps> = ({
  open,
  onOpenChange,
  pendingCount,
  onConfirm,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <span>Faltan {pendingCount} items por recibir</span>
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription className="space-y-4">
          Hay {pendingCount} productos que no han sido escaneados. ¿Qué deseas
          hacer con ellos?
          <div className="grid gap-2 pt-4">
            <Button
              variant="outline"
              className="justify-start h-auto p-3"
              onClick={() => {
                onConfirm("mark-lost");
                onOpenChange(false);
              }}
            >
              <div className="text-left">
                <p className="font-medium">Marcar como perdidos</p>
                <p className="text-xs text-muted-foreground">
                  Los items se marcarán como perdidos en el inventario
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-3"
              onClick={() => {
                onConfirm("keep-transit");
                onOpenChange(false);
              }}
            >
              <div className="text-left">
                <p className="font-medium">Mantener en tránsito</p>
                <p className="text-xs text-muted-foreground">
                  Los items seguirán pendientes para próxima recepción
                </p>
              </div>
            </Button>
          </div>
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
