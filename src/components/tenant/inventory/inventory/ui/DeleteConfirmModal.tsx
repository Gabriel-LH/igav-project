"use client";
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
import { Loader2, Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  title?: string;
  description?: string;
  itemName?: string;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  title = "¿Eliminar registro?",
  description,
  itemName,
}: DeleteConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 pt-1">
            {description ?? (
              <>
                Esta acción{" "}
                <span className="font-semibold text-foreground">
                  no se puede deshacer
                </span>
                . El registro será eliminado permanentemente de la base de
                datos.
              </>
            )}
            {itemName && (
              <div className="mt-3 rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm font-medium text-foreground">
                {itemName}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Sí, eliminar
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
