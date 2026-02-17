"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, ListChecks } from "lucide-react";
import { useCartStore } from "@/src/store/useCartStore";
import { formatCurrency } from "@/src/utils/currency-format";
import { PosCartItem } from "./pos-cart-item";
import { PosCheckoutModal } from "./modals/PosCheckoutModal";
import { PosReservationModal } from "./modals/PosReservationModal";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingCart02Icon } from "@hugeicons/core-free-icons";

export function PosCartSection() {
  const { items, getTotal, clearCart } = useCartStore();

  const total = getTotal();

  // ─── MODALES ───
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [reservationOpen, setReservationOpen] = React.useState(false);

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* 1. HEADER CLIENTE */}
      <div className="p-3 border-b  flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border bg-amber-50 flex items-center justify-center text-blue-700">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Lista de Productos</p>
          </div>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearCart}
            className="text-muted-foreground hover:text-destructive h-8 w-8"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 3. LISTA DE ITEMS */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground opacity-50 gap-2">
            <HugeiconsIcon
              icon={ShoppingCart02Icon}
              className="w-10 h-10 stroke-1"
            />
            <p className="text-sm italic">Carrito vacío</p>
            <p className="text-[10px]">
              Escanea un producto o selecciónalo del catálogo
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {items.map((item) => (
              <PosCartItem key={item.cartId} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* 4. FOOTER DE TOTALES Y ACCIONES */}
      <div className="p-4 bg-background border-t shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] z-10">
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-end">
            <span className="text-lg font-bold">Total a Pagar</span>
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* --- BOTONES DE ACCIÓN --- */}
        <div className="grid grid-cols-4 gap-2 h-12">
          <Button
            variant="outline"
            className="col-span-1 h-full border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 flex flex-col gap-0.5"
            onClick={() => setReservationOpen(true)}
            disabled={items.length === 0}
          >
            <span className="text-[10px] font-bold uppercase">Reservar</span>
            <span className="text-[9px] opacity-80">(Adelanto)</span>
          </Button>

          <Button
            className="col-span-3 h-full text-lg text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-lg"
            onClick={() => setCheckoutOpen(true)}
            disabled={items.length === 0}
          >
            COBRAR
          </Button>
        </div>
      </div>

      {/* ─── MODALES ─── */}
      <PosCheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} />
      <PosReservationModal
        open={reservationOpen}
        onOpenChange={setReservationOpen}
      />
    </div>
  );
}
