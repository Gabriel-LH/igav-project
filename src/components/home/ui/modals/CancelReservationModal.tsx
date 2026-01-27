import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function CancelReservationModal({
  open,
  onOpenChange,
  onConfirm,
  balance,
}: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-red-800/40">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={24} />
            <DialogTitle>Anular Reserva</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            ¿Está seguro que desea anular esta reserva? Esta acción liberará el stock inmediatamente.
          </DialogDescription>
        </DialogHeader>
        {balance > 0 && (
          <div className="bg-destructive/10 p-3 rounded-lg text-destructive text-xs font-medium">
            Atención: Existe un saldo abonado. Deberá gestionar la devolución de dinero manualmente.
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>No, mantener</Button>
          <Button variant="destructive" onClick={onConfirm}>Confirmar Anulación</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}