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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function CancelReservationModal({
  open,
  onOpenChange,
  onConfirm,
  balance,
  customerMode,
}: any) {
  const [refundMethod, setRefundMethod] = useState<"refund" | "credit">("refund");

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
          <div className="space-y-4">
            <div className="bg-destructive/10 p-3 rounded-lg text-destructive text-xs font-medium">
              Atención: Existe un saldo abonado. Indique qué hacer con el dinero.
            </div>
            
            <div className="space-y-2">
              <Label>Destino del monto a revertir</Label>
              <RadioGroup
                value={refundMethod}
                onValueChange={(val: "refund" | "credit") => setRefundMethod(val)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="refund" id="r1" />
                  <Label htmlFor="r1" className="font-normal">Devolver dinero (Efectivo/Transferencia)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="credit" 
                    id="r2" 
                    disabled={customerMode === "general"} 
                  />
                  <Label 
                    htmlFor="r2" 
                    className={`font-normal ${customerMode === "general" ? "opacity-50" : ""}`}
                  >
                    Mantener como Crédito a favor del Cliente
                    {customerMode === "general" && <span className="ml-1 text-xs text-muted-foreground">(Requiere registrado)</span>}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>No, mantener</Button>
          <Button variant="destructive" onClick={() => onConfirm(refundMethod)}>Confirmar Anulación</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}