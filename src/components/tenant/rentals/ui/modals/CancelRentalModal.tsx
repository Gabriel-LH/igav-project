import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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

import { Badge } from "@/components/badge";
import { useInventoryStore } from "@/src/store/useInventoryStore";

export function CancelRentalModal({
  open,
  onOpenChange,
  rental,
  onConfirm,
}: CancelRentalModalProps) {
  const [reason, setReason] = useState("");

  const { rentalItems } = useRentalStore();
  const { products } = useInventoryStore(); // Import products
  const currentItems = rentalItems.filter(
    (item) => item.rentalId === rental.id,
  );

  // Group items
  const groupedItems = currentItems.reduce(
    (acc, item) => {
      const product = products.find((p) => p.id === item.productId);
      const key = item.productId;
      if (!acc[key]) {
        acc[key] = { product, quantity: 0 };
      }
      acc[key].quantity += item.quantity; // Usually 1
      return acc;
    },
    {} as Record<string, { product: any; quantity: number }>,
  );

  return (
    <Dialog aria-hidden="false" open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle>Anular Alquiler</DialogTitle>
          </div>
          <DialogDescription>
            Esta acción marcará el alquiler{" "}
            <strong>#{rental.id.slice(-6)}</strong> como anulado. El stock será
            liberado automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span>Total a revertir:</span>
              <span className="font-bold text-lg">
                S/.{" "}
                {currentItems.reduce(
                  (acc, item) => acc + item.priceAtMoment,
                  0,
                )}
              </span>
            </div>
            {/* Summary of items */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Productos incluidos:
              </p>
              {Object.values(groupedItems).map((group: any) => (
                <div
                  key={group.product?.id || Math.random()}
                  className="flex justify-between text-xs"
                >
                  <span>{group.product?.name || "Producto"}</span>
                  <Badge variant="outline" className="h-5">
                    x{group.quantity}
                  </Badge>
                </div>
              ))}
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
