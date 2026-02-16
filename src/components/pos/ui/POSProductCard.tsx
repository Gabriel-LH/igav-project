"use client";

import { Product } from "@/src/types/product/type.product";
import { useCartStore } from "@/src/store/useCartStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import { formatCurrency } from "@/src/utils/currency-format";
import { ShoppingBag, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Importa tu librería de toast
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PosProductCardProps {
  product: Product;
}

// Subcomponente para seleccionar variante (Miniatura del que ya tienes)
function VariantSelector({
  product,
  type,
  onClose,
}: {
  product: Product;
  type: "venta" | "alquiler";
  onClose: () => void;
}) {
  const { stock } = useInventoryStore();
  const { addItem } = useCartStore();

  // Filtramos stock disponible para este producto
  const productStock = stock.filter(
    (s) => s.productId === product.id && s.status === "disponible",
  );

  // Obtener tallas únicas
  const sizes = Array.from(new Set(productStock.map((s) => s.size)));
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Obtener colores según talla seleccionada
  const colors = selectedSize
    ? Array.from(
        new Set(
          productStock
            .filter((s) => s.size === selectedSize)
            .map((s) => s.color),
        ),
      )
    : [];

  const handleConfirm = (color: string) => {
    // Calcular stock máximo de esta combinación específica
    const variantStock = productStock.filter(
      (s) =>
        s.size === selectedSize &&
        s.color === color &&
        (type === "venta" ? s.isForSale : s.isForRent),
    );

    const maxQty = variantStock.reduce((acc, curr) => acc + curr.quantity, 0);

    if (maxQty === 0) return; // No debería pasar si filtramos bien, pero por seguridad

    addItem(product, type, undefined, maxQty, { size: selectedSize!, color });
    onClose();
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase text-muted-foreground">
          1. Talla
        </span>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <Button
              key={size}
              variant={selectedSize === size ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSize(size)}
              className="w-10 h-10 p-0"
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {selectedSize && (
        <div className="space-y-2 animate-in fade-in">
          <span className="text-xs font-bold uppercase text-muted-foreground">
            2. Color
          </span>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              // Calcular disponibilidad rápida para mostrar visualmente
              const qty = productStock
                .filter(
                  (s) =>
                    s.size === selectedSize &&
                    s.color === color &&
                    (type === "venta" ? s.isForSale : s.isForRent),
                )
                .reduce((a, b) => a + b.quantity, 0);

              return (
                <Button
                  key={color}
                  variant="outline"
                  disabled={qty === 0}
                  onClick={() => handleConfirm(color)}
                  className="text-xs gap-2"
                >
                  {color}
                  <Badge variant="secondary" className="text-[9px] h-4 px-1">
                    {qty}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function PosProductCard({ product }: PosProductCardProps) {
  const { addItem, items } = useCartStore();
  const { stock } = useInventoryStore();

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [operationType, setOperationType] = useState<"venta" | "alquiler">(
    "venta",
  );

  // Lógica de Stock General (solo para mostrar el badge en la tarjeta)
  const availableItems = stock.filter(
    (s) => s.productId === product.id && s.status === "disponible",
  );
  const hasVariants = availableItems.some((s) => s.size || s.color); // Detectar si tiene variantes
  const totalStock = availableItems.length;

  // 2. CALCULAR STOCK PARA VENTA Y ALQUILER
  const stockForSale = availableItems
    .filter((s) => s.isForSale)
    .reduce((acc, curr) => acc + curr.quantity, 0);
  const stockForRent = availableItems
    .filter((s) => s.isForRent)
    .reduce((acc, curr) => acc + curr.quantity, 0);

  // Stock total visible (la suma de cantidades físicas disponibles)
  const totalPhysicalStock = availableItems.reduce(
    (acc, curr) => acc + curr.quantity,
    0,
  );

  // 3. OBTENER CANTIDAD YA EN CARRITO
  // Buscamos cuánto de este producto ya tenemos en el carrito para venta y alquiler
  const inCartSale =
    items.find(
      (i) => i.product.id === product.id && i.operationType === "venta",
    )?.quantity || 0;
  const inCartRent =
    items.find(
      (i) => i.product.id === product.id && i.operationType === "alquiler",
    )?.quantity || 0;

  // 4. CALCULAR REMANENTE REAL
  const remainingForSale = stockForSale - inCartSale;
  const remainingForRent = stockForRent - inCartRent;

  const handleAdd = (type: "venta" | "alquiler") => {
    const max = type === "venta" ? stockForSale : stockForRent;
    const currentInCart = type === "venta" ? inCartSale : inCartRent;

    if (currentInCart >= max) {
      toast.error(`No hay más stock disponible para ${type}`);
      return;
    }

    addItem(product, type, undefined, max); // Pasamos el maxQuantity al store

    // Feedback visual opcional (pequeño sonido o vibración si es móvil)
  };

  const handleClick = (type: "venta" | "alquiler") => {
    // SI TIENE VARIANTES -> ABRIR MODAL
    if (hasVariants) {
      setOperationType(type);
      setSelectorOpen(true);
    } else {
      // SI NO TIENE VARIANTES (Producto único o servicio) -> AGREGAR DIRECTO
      // Calcular max stock del producto genérico
      const genericStock = availableItems.filter((s) =>
        type === "venta" ? s.isForSale : s.isForRent,
      );
      const max = genericStock.reduce((acc, curr) => acc + curr.quantity, 0);

      addItem(product, type, undefined, max);
    }
  };

  return (
    <>
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all h-full">
        {/* IMAGEN + BADGES */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted/50">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-2">
              <ShoppingBag className="w-8 h-8 opacity-20" />
              <span className="text-[10px]">Sin imagen</span>
            </div>
          )}

          {/* Badges Flotantes */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {product.is_serial ? (
              <Badge
                variant="secondary"
                className="bg-blue-100/90 text-blue-700 border-blue-200 text-[10px] backdrop-blur-sm shadow-sm"
              >
                Serial
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-white/90 text-slate-600 text-[10px] backdrop-blur-sm shadow-sm"
              >
                Lote
              </Badge>
            )}

            {/* Badge de Stock Total */}
            {totalPhysicalStock > 0 ? (
              <Badge
                variant="outline"
                className="bg-white/90 text-emerald-700 border-emerald-200 text-[10px] backdrop-blur-sm shadow-sm font-bold"
              >
                Stock: {totalPhysicalStock}
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-[10px] shadow-sm">
                Agotado
              </Badge>
            )}
          </div>
        </div>

        {/* INFO + ACCIONES */}
        <div className="p-3 flex flex-col flex-1">
          <div className="mb-2">
            <h3
              className="font-bold text-sm line-clamp-2 leading-tight min-h-10"
              title={product.name}
            >
              {product.name}
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 truncate">
              {product.category || "General"}
            </p>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2">
            {/* BOTÓN VENTA */}
            {product.can_sell ? (
              <Button
                variant="outline"
                size="sm"
                disabled={remainingForSale <= 0} // 🔥 BLOQUEO SI YA LO AGOTASTE EN CARRITO
                className={cn(
                  "h-auto flex-col py-2 px-1 gap-1 border-emerald-200/60 bg-emerald-50/30 hover:bg-emerald-100/50 hover:border-emerald-300 transition-all relative overflow-hidden",
                  remainingForSale <= 0 &&
                    "opacity-50 grayscale cursor-not-allowed bg-slate-100 border-slate-200",
                )}
                onClick={() => handleClick("venta")}
              >
                {/* Barra de progreso de stock sutil */}
                {inCartSale > 0 && stockForSale > 0 && (
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-emerald-400/50 transition-all duration-300"
                    style={{ width: `${(inCartSale / stockForSale) * 100}%` }}
                  />
                )}

                <div className="flex justify-between w-full px-1 items-center">
                  <span className="text-[9px] uppercase font-bold text-emerald-600/70">
                    Vender
                  </span>
                  {/* Contador pequeño de disponibles para venta */}
                  <span className="text-[8px] text-emerald-600/50">
                    {remainingForSale} disp.
                  </span>
                </div>
                <span className="font-black text-sm text-emerald-700">
                  {formatCurrency(product.price_sell ?? 0)}
                </span>
              </Button>
            ) : (
              <div className="rounded-md border border-dashed border-muted bg-muted/20 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/50">
                  No venta
                </span>
              </div>
            )}

            {/* BOTÓN ALQUILER */}
            {product.can_rent ? (
              <Button
                variant="outline"
                size="sm"
                disabled={remainingForRent <= 0} // 🔥 BLOQUEO SI YA LO AGOTASTE EN CARRITO
                className={cn(
                  "h-auto flex-col py-2 px-1 gap-1 border-blue-200/60 bg-blue-50/30 hover:bg-blue-100/50 hover:border-blue-300 transition-all relative overflow-hidden",
                  remainingForRent <= 0 &&
                    "opacity-50 grayscale cursor-not-allowed bg-slate-100 border-slate-200",
                )}
                onClick={() => handleClick("alquiler")}
              >
                {/* Barra de progreso de stock sutil */}
                {inCartRent > 0 && stockForRent > 0 && (
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-blue-400/50 transition-all duration-300"
                    style={{ width: `${(inCartRent / stockForRent) * 100}%` }}
                  />
                )}

                <div className="flex justify-between w-full px-1 items-center">
                  <span className="text-[9px] uppercase font-bold text-blue-600/70">
                    Alquilar
                  </span>
                  <span className="text-[8px] text-blue-600/50">
                    {remainingForRent} disp.
                  </span>
                </div>
                <span className="font-black text-sm text-blue-700">
                  {formatCurrency(product.price_rent ?? 0)}
                </span>
              </Button>
            ) : (
              <div className="rounded-md border border-dashed border-muted bg-muted/20 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/50">
                  No renta
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogContent className="max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Seleccionar variante ({operationType})</DialogTitle>
          </DialogHeader>
          <VariantSelector
            product={product}
            type={operationType}
            onClose={() => setSelectorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
