import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { Rental } from "@/src/types/rentals/type.rentals"; 
import { useRentalStore } from "@/src/store/useRentalStore";

interface CancelRentalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental: Rental;
  onConfirm: (rentalId: string, reason: string) => void;
}

export function CancelRentalModal({ open, onOpenChange, rental, onConfirm }: CancelRentalModalProps) {
  const [reason, setReason] = useState("");
  
  const {rentalItems} = useRentalStore()
  const rentalItem = rentalItems.filter((item) => item.rentalId === rental.id)

  return (
    <Dialog aria-hidden="false" open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle>Anular Alquiler</DialogTitle>
          </div>
          <DialogDescription>
            Esta acción marcará el alquiler <strong>#{rental.id.slice(-6)}</strong> como anulado. 
            El stock será liberado automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span>Total a revertir:</span>
              <span className="font-bold text-lg">S/. {rentalItem.reduce((acc, item) => acc + item.priceAtMoment, 0)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo de la anulación</Label>
            <Textarea 
              id="reason"
              placeholder="Ej. Error en el cobro, cliente desistió..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button 
            variant="destructive" 
            disabled={!reason.trim()}
            onClick={() => onConfirm(rental.id, reason)}
          >
            Confirmar Anulación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}