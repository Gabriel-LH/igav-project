"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/drawer";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/src/store/useCartStore";
import { formatCurrency } from "@/src/utils/currency-format";
import { toast } from "sonner";
import { savePresaleAction } from "@/src/app/(tenant)/tenant/actions/presale.actions";
import { PresaleBarcodeModal } from "../presale/PresaleBarcodeModal";

interface HomeCartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HomeCartDrawer({ open, onOpenChange }: HomeCartDrawerProps) {
  const { items, getTotal, removeItem, clearCart, customerId } = useCartStore();
  const total = getTotal();
  const [isSaving, setIsSaving] = React.useState(false);
  const [presaleData, setPresaleData] = React.useState<{ id: string; referenceCode: string } | null>(null);

  const handleGeneratePresale = async () => {
    if (items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setIsSaving(true);
    try {
      // Simplificado: Tomamos la sucursal del primer item o de la tienda
      const branchId = (items[0].product as any).branchId || ""; 
      
      const dto = {
        type: items[0].operationType,
        branchId,
        customerId,
        items: items.map(item => ({
          productId: item.product.id,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAtMoment: item.unitPrice,
          subtotal: item.subtotal,
          inventoryItemId: item.selectedCodes?.[0], // Si es serializado
          stockId: !item.product.is_serial ? item.selectedCodes?.[0] : undefined, // Si es lote
        })),
        financials: {
          subtotal: total,
          totalAmount: total,
        }
      };

      const res = await savePresaleAction(dto);
      if (res.success) {
        setPresaleData(res.data);
        clearCart();
        toast.success("Pre-venta generada con éxito");
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al generar la pre-venta");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="h-full ml-auto sm:max-w-md border-l shadow-2xl">
          <DrawerHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <DrawerTitle className="text-xl font-bold">Resumen de Pedido</DrawerTitle>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                <ShoppingBag className="w-16 h-16 stroke-1" />
                <div>
                  <p className="font-semibold text-lg">Tu carrito está vacío</p>
                  <p className="text-sm">Agregue productos desde el catálogo para comenzar.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.cartId} className="flex gap-4 p-3 bg-card rounded-xl border shadow-sm group">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                        <span className="uppercase font-bold bg-muted px-1.5 rounded text-[10px]">
                          {item.operationType}
                        </span>
                      </p>
                      {item.selectedCodes.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.selectedCodes.map(code => (
                             <span key={code} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 font-mono">
                               {code.slice(-8)}
                             </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <p className="font-bold text-sm text-primary">{formatCurrency(item.subtotal)}</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeItem(item.cartId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DrawerFooter className="border-t bg-muted/10 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground font-medium">Subtotal Estimado</span>
              <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
            </div>
            <div className="grid gap-2">
              <Button 
                size="lg" 
                className="w-full text-lg h-14 font-bold shadow-lg shadow-primary/20"
                disabled={items.length === 0 || isSaving}
                onClick={handleGeneratePresale}
              >
                {isSaving ? "Generando..." : "Generar Pre-venta"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">Continuar Comprando</Button>
              </DrawerClose>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed uppercase tracking-widest font-bold">
              El pago final se realiza en caja
            </p>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {presaleData && (
        <PresaleBarcodeModal
          open={!!presaleData}
          onOpenChange={(open) => !open && setPresaleData(null)}
          code={presaleData.referenceCode}
        />
      )}
    </>
  );
}
