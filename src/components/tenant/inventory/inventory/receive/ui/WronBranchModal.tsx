// src/components/inventory/assignment/WrongBranchModal.tsx
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
import { Building2, AlertTriangle } from "lucide-react";

interface WrongBranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemCode: string;
  expectedBranch: string;
  currentBranch: string;
  onConfirm: (action: "reassign" | "report") => void;
}

export const WrongBranchModal: React.FC<WrongBranchModalProps> = ({
  open,
  onOpenChange,
  itemCode,
  expectedBranch,
  currentBranch,
  onConfirm,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Item en sucursal equivocada</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            <p>
              El item <span className="font-mono font-bold">{itemCode}</span>{" "}
              estaba destinado a:
            </p>

            <div className="grid gap-2">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-700">
                  Sucursal Esperada:
                </p>
                <p className="text-lg font-bold text-red-800">
                  {expectedBranch}
                </p>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm font-medium text-orange-700">
                  Sucursal Actual:
                </p>
                <p className="text-lg font-bold text-orange-800">
                  {currentBranch}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              ¿Qué deseas hacer con este item?
            </p>

            <div className="grid gap-2">
              <Button
                variant="outline"
                className="justify-start h-auto p-3 border-blue-200 hover:bg-blue-50"
                onClick={() => {
                  onConfirm("reassign");
                  onOpenChange(false);
                }}
              >
                <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium">Reasignar aquí</p>
                  <p className="text-xs text-muted-foreground">
                    El item se quedará en {currentBranch}
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto p-3 border-red-200 hover:bg-red-50"
                onClick={() => {
                  onConfirm("report");
                  onOpenChange(false);
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                <div className="text-left">
                  <p className="font-medium">Reportar error de envío</p>
                  <p className="text-xs text-muted-foreground">
                    Se notificará al área de logística
                  </p>
                </div>
              </Button>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar escaneo</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
