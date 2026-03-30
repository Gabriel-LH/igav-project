"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartStore } from "@/src/store/useCartStore";
import { useTenantConfigStore } from "@/src/store/useTenantConfigStore";
import { formatCurrency } from "@/src/utils/currency-format";
import { Tag, Percent, Banknote, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { PinAuthModal } from "./PinAuthModal";

interface ManualDiscountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartId: string;
}

export function ManualDiscountModal({
  open,
  onOpenChange,
  cartId,
}: ManualDiscountModalProps) {
  const { items, updateManualDiscount } = useCartStore();
  const { config } = useTenantConfigStore();
  
  const item = items.find((i) => i.cartId === cartId);
  
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [showPinAuth, setShowPinAuth] = useState(false);
  
  const listPrice = item?.listPrice || item?.unitPrice || 0;
  const maxLimitPercent = config?.pricing?.maxDiscountLimit ?? 100;
  const allowStacking = config?.pricing?.allowDiscountStacking ?? true;
  const hasPromo = !!item?.appliedPromotionId && !item?.manualDiscountAmount;

  useEffect(() => {
    if (open && item) {
      if (item.manualDiscountAmount) {
        setValue(item.manualDiscountAmount.toString());
        setReason(item.manualDiscountReason || "");
      } else {
        setValue("");
        setReason("");
      }
    }
  }, [open, item]);

  if (!item) return null;

  const handleApply = () => {
    const numValue = parseFloat(value) || 0;
    let finalAmount = 0;

    if (discountType === "percent") {
      if (numValue > maxLimitPercent) {
        toast.error(`El descuento máximo permitido es ${maxLimitPercent}%`);
        return;
      }
      finalAmount = (listPrice * numValue) / 100;
    } else {
      const maxAmount = (listPrice * maxLimitPercent) / 100;
      if (numValue > maxAmount) {
        toast.error(`El descuento máximo permitido es ${formatCurrency(maxAmount)} (${maxLimitPercent}%)`);
        return;
      }
      finalAmount = numValue;
    }

    const executeApply = () => {
      updateManualDiscount(cartId, finalAmount, reason);
      toast.success("Descuento aplicado correctamente");
      onOpenChange(false);
    };

    if (config?.security?.requirePinForManualPriceEdit) {
      setShowPinAuth(true);
    } else {
      executeApply();
    }
  };

  const handlePinSuccess = () => {
    const numValue = parseFloat(value) || 0;
    let finalAmount = 0;
    if (discountType === "percent") {
      finalAmount = (listPrice * numValue) / 100;
    } else {
      finalAmount = numValue;
    }
    updateManualDiscount(cartId, finalAmount, reason);
    toast.success("Descuento autorizado y aplicado");
    onOpenChange(false);
  };

  const currentDiscountPercent = listPrice > 0 ? (parseFloat(value) || 0) : 0;
  const calculatedDiscount = discountType === "percent" 
    ? (listPrice * (parseFloat(value) || 0)) / 100
    : (parseFloat(value) || 0);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 uppercase text-sm font-black">
            <Tag className="w-4 h-4 text-emerald-500" />
            Aplicar Descuento Manual
          </DialogTitle>
          <DialogDescription className="text-xs">
            Estás aplicando un descuento a: <span className="font-bold text-slate-200">{item.product.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!allowStacking && hasPromo && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-[11px] text-amber-200/80 leading-relaxed">
                <p className="font-bold text-amber-500 uppercase mb-1">Conflicto de Descuento</p>
                Este producto ya tiene una promoción activa. Al aplicar un descuento manual, 
                <span className="font-bold text-amber-400"> la promoción se anulará</span> ya que la acumulación no está permitida.
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Tabs value={discountType} onValueChange={(v) => setDiscountType(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="amount" className="text-xs font-bold gap-2">
                  <Banknote className="w-3 h-3" /> Monto Fijo
                </TabsTrigger>
                <TabsTrigger value="percent" className="text-xs font-bold gap-2">
                  <Percent className="w-3 h-3" /> Porcentaje
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="discount-value" className="text-xs font-bold uppercase text-muted-foreground">
                Valor del Descuento
              </Label>
              <div className="relative">
                <Input
                  id="discount-value"
                  type="number"
                  placeholder="0.00"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="pl-8 text-lg font-black"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {discountType === "percent" ? "%" : "$"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-reason" className="text-xs font-bold uppercase text-muted-foreground">
                Motivo / Razón
              </Label>
              <Input
                id="discount-reason"
                placeholder="Ej. Descuento por detalle técnico"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 space-y-1.5">
               <div className="flex justify-between text-[10px] uppercase font-medium text-muted-foreground">
                  <span>Resumen</span>
                  <span>Impacto</span>
               </div>
               <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">Precio Base:</span>
                    <span className="text-xs font-bold">{formatCurrency(listPrice)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Nuevo Precio:</span>
                    <div className="text-lg font-black text-emerald-500">
                      {formatCurrency(Math.max(0, listPrice - calculatedDiscount))}
                    </div>
                  </div>
               </div>
               <div className="pt-1.5 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-500 italic">
                  <Info className="w-3 h-3" />
                  Max. permitido: {maxLimitPercent}% ({formatCurrency((listPrice * maxLimitPercent) / 100)})
               </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs uppercase font-bold">
            Cancelar
          </Button>
          <Button onClick={handleApply} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase font-bold px-8">
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <PinAuthModal
      open={showPinAuth}
      onOpenChange={setShowPinAuth}
      onSuccess={handlePinSuccess}
      title="Autorización para Descuento"
      description={`Se requiere PIN de administrador para aplicar un descuento manual de ${discountType === "percent" ? value + "%" : formatCurrency(parseFloat(value) || 0)}.`}
    />
    </>
  );
}
