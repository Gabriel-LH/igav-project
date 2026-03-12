// components/products/CostAdjustmentModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductVariant } from "@/src/types/product/type.productVariant";
import { History, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface CostAdjustmentModalProps {
  variant: ProductVariant | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    variantId: string;
    newPrice: number;
    reason: string;
    oldPrice: number;
  }) => void;
}

export function CostAdjustmentModal({
  variant,
  isOpen,
  onClose,
  onConfirm,
}: CostAdjustmentModalProps) {
  const [newPrice, setNewPrice] = useState<number>(variant?.purchasePrice || 0);
  const [reason, setReason] = useState<string>("adjustment");

  const priceSell = variant?.priceSell || 0;

  // El margen se calcula con el nuevo precio que el usuario está escribiendo
  const margin = priceSell > 0 ? ((priceSell - newPrice) / priceSell) * 100 : 0;
  const isLowMargin = margin < 10; // Alerta si es menor al 10%

  if (!variant) return null;

  const handleConfirm = () => {
    onConfirm({
      variantId: variant.id,
      oldPrice: variant.purchasePrice || 0,
      newPrice,
      reason,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Ajustar Costo de Compra
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div className="text-sm">
              <p className="text-muted-foreground">Variante</p>
              <p className="font-mono font-bold">{variant.variantCode}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-muted-foreground">Costo Actual</p>
              <p className="font-bold">
                ${variant.purchasePrice?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-price">Nuevo Costo de Compra</Label>
            <Input
              id="new-price"
              type="number"
              step="0.01"
              defaultValue={variant.purchasePrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-md border bg-slate-50 p-2 mt-2">
            {/* PRECIO VENTA */}
            <div className="flex flex-col items-center border-r">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                Precio Venta
              </span>
              <span className="text-sm font-bold text-slate-900">
                ${priceSell.toFixed(2)}
              </span>
            </div>

            {/* GANANCIA (Lo que tú viste como 'mediana') */}
            <div className="flex flex-col items-center border-r">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                Ganancia
              </span>
              <span
                className={cn(
                  "text-sm font-bold",
                  priceSell - newPrice > 0
                    ? "text-slate-900"
                    : "text-destructive",
                )}
              >
                ${(priceSell - newPrice).toFixed(2)}
              </span>
            </div>

            {/* MARGEN % */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                Margen
              </span>
              <span
                className={cn(
                  "text-sm font-bold px-2 rounded-full",
                  margin > 20
                    ? "bg-green-100 text-green-700"
                    : margin > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700",
                )}
              >
                {margin.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo del Ajuste</Label>
            <Select defaultValue={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adjustment">Corrección manual</SelectItem>
                <SelectItem value="purchase">
                  Actualización por proveedor
                </SelectItem>
                <SelectItem value="import">Error de carga de datos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Save className="h-4 w-4" /> Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
