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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle } from "lucide-react";
import { Sale } from "@/src/types/sales/type.sale";
import { useSaleStore } from "@/src/store/useSaleStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Badge } from "@/components/badge";
import { useTenantConfigStore } from "@/src/store/useTenantConfigStore";
import { PinAuthModal } from "../../../pos/modals/PinAuthModal";

interface CancelSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
  onConfirm: (saleId: string, reason: string, refundMethod: "refund" | "credit") => void;
}

export function CancelSaleModal({
  open,
  onOpenChange,
  sale,
  onConfirm,
}: CancelSaleModalProps) {
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<"refund" | "credit">("refund");
  const [showPinAuth, setShowPinAuth] = useState(false);
  const { saleItems } = useSaleStore();
  const { products } = useInventoryStore();
  const { policy } = useTenantConfigStore();

  const requirePin = policy?.security.requirePinForCancelOperation ?? true;

  const currentItems = saleItems.filter((i) => i.saleId === sale.id);

  const groupedItems = currentItems.reduce(
    (acc, item) => {
      const product = products.find((p) => p.id === item.productId);
      const key = item.productId;
      if (!acc[key]) {
        acc[key] = { product, quantity: 0 };
      }
      acc[key].quantity += item.quantity;
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
            <DialogTitle>Anular Venta</DialogTitle>
          </div>
          <DialogDescription>
            Esta acción marcará la venta <strong>#{sale.id.slice(-6)}</strong>{" "}
            como anulada. El stock será liberado automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span>Total a revertir:</span>
              <span className="font-bold text-lg">S/. {sale.totalAmount}</span>
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
                  disabled={sale.customerMode === "general"} 
                />
                <Label 
                  htmlFor="r2" 
                  className={`font-normal ${sale.customerMode === "general" ? "opacity-50" : ""}`}
                >
                  Mantener como Crédito a favor del Cliente
                  {sale.customerMode === "general" && <span className="ml-1 text-xs text-muted-foreground">(Requiere cliente registrado)</span>}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim()}
            onClick={() => {
              if (requirePin) {
                setShowPinAuth(true);
              } else {
                onConfirm(sale.id, reason, refundMethod);
              }
            }}
          >
            Confirmar Anulación
          </Button>
        </DialogFooter>
      </DialogContent>

      <PinAuthModal
        open={showPinAuth}
        onOpenChange={setShowPinAuth}
        onSuccess={() => {
          onConfirm(sale.id, reason, refundMethod);
          onOpenChange(false);
        }}
        title="Autorización Requerida"
        description={`Se requiere PIN de administrador para anular la venta #${sale.id.slice(-6)}.`}
      />
    </Dialog>
  );
}
