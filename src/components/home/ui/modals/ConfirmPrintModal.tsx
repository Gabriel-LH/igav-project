import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
import { Button } from "@/components/button";
import { printTicket } from "@/src/utils/ticket/print-ticket";

interface ConfirmPrintModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticketToPrint: string | null;
}

export const ConfirmPrintModal = ({
    open,
    onOpenChange,
    ticketToPrint
}: ConfirmPrintModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Imprimir comprobante?</DialogTitle>
          <DialogDescription>
            ¿Desea imprimir el comprobante del pago realizado?
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            No
          </Button>
          <Button
            onClick={() => {
              if (ticketToPrint) printTicket(ticketToPrint);
              onOpenChange(false);
            }}
          >
            Sí, imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
