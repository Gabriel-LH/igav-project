"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Tick01Icon } from "@hugeicons/core-free-icons";

interface StatusTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary";
  productName?: string;
}

export function StatusTransitionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  confirmVariant = "default",
  productName,
}: StatusTransitionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] border-none shadow-2xl">
        <DialogHeader className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500 shadow-inner">
            <HugeiconsIcon icon={AlertCircleIcon} size={32} strokeWidth={2} />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium">
              {description}
              {productName && (
                <span className="block mt-2 font-bold text-slate-900 uppercase">
                  {productName}
                </span>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 font-bold uppercase text-[11px] tracking-wider border-slate-200 hover:bg-slate-50"
          >
            Cancelar
          </Button>
          <Button
            variant={confirmVariant}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 font-bold uppercase text-[11px] tracking-wider shadow-lg transition-transform active:scale-95"
          >
            <HugeiconsIcon icon={Tick01Icon} size={16} className="mr-2" />
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
