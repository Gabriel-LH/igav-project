"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarcodeDisplay } from "@/src/components/tenant/inventory/inventory/barcode/BarcodeDisplay";
import { CheckCircle2, Printer, X } from "lucide-react";
import { toast } from "sonner";

interface PresaleBarcodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
}

export function PresaleBarcodeModal({ open, onOpenChange, code }: PresaleBarcodeModalProps) {
  const handlePrint = () => {
    window.print();
    toast.info("Función de impresión no implementada por completo, pero el código es: " + code);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white text-center space-y-2 relative">
           <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-4">
              <CheckCircle2 className="w-10 h-10 text-white" />
           </div>
           <DialogTitle className="text-2xl font-black">¡Pre-venta Generada!</DialogTitle>
           <DialogDescription className="text-emerald-50 text-balance">
             Indique el siguiente código al cajero para completar el pago de su pedido.
           </DialogDescription>
        </div>
        
        <div className="p-8 space-y-6 bg-background">
          <div className="flex justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-muted shadow-sm">
            <BarcodeDisplay value={code} />
          </div>

          <div className="text-center space-y-1">
             <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Código de Referencia</p>
             <p className="text-3xl font-black font-mono tracking-tighter text-foreground">{code}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
                Imprimir Ticket
             </Button>
             <Button className="font-bold" onClick={() => onOpenChange(false)}>
                Listo, Continuar
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
