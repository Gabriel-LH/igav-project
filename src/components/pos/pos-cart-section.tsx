"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserCircle, CalendarClock, Trash2 } from "lucide-react";
import { useCartStore } from "@/src/store/useCartStore";
import { formatCurrency } from "@/src/utils/currency-format";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PosCartItem } from "./pos-cart-item";
import { CustomerSelector } from "@/src/components/home/ui/reservation/CustomerSelector";
import { PosCheckoutModal } from "./modals/PosCheckoutModal";
import { PosReservationModal } from "./modals/PosReservationModal";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

export function PosCartSection() {
  const { items, getTotal, clearCart, globalRentalDates, setGlobalDates } =
    useCartStore();

  const total = getTotal();
  const hasRentals = items.some((i) => i.operationType === "alquiler");

  // ─── MODALES ───
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [reservationOpen, setReservationOpen] = React.useState(false);

  // ─── SELECTOR DE CLIENTE (inline en header) ───
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);


  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* 1. HEADER CLIENTE */}
      <div className="p-3 border-b  flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border bg-amber-50 flex items-center justify-center text-blue-700">
            <UserCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">
              {selectedCustomer
                ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                : "Cliente General"}
            </p>

            <Popover>
              <PopoverTrigger asChild>
                <p className="text-[10px] text-blue-600 cursor-pointer hover:underline font-medium">
                  {selectedCustomer ? "Cambiar" : "Seleccionar / Crear"}
                </p>
              </PopoverTrigger>
              <PopoverContent
                className="w-[400px] p-0"
                side="left"
                align="start"
              >
                <CustomerSelector
                  selected={selectedCustomer}
                  onSelect={(client) => setSelectedCustomer(client)}
                />
              </PopoverContent>
            </Popover>
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

      {/* 2. HEADER DE FECHAS (Solo visible si hay alquileres) */}
      {hasRentals && (
        <div className="px-3 py-2 border-b flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">
              Fechas de Alquiler
            </span>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-amber-200 hover:bg-amber-100"
              >
                {globalRentalDates?.from ? (
                  <>
                    {format(globalRentalDates.from, "d MMM", { locale: es })} -{" "}
                    {globalRentalDates?.to
                      ? format(globalRentalDates.to, "d MMM", { locale: es })
                      : " ..."}
                  </>
                ) : (
                  "Seleccionar fechas"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={
                  globalRentalDates
                    ? { from: globalRentalDates.from, to: globalRentalDates.to }
                    : undefined
                }
                onSelect={(range: DateRange | undefined) => {
                  if (range?.from && range?.to) {
                    setGlobalDates({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* 3. LISTA DE ITEMS */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground opacity-50 gap-2">
            <UserCircle className="w-10 h-10 stroke-1" />
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
