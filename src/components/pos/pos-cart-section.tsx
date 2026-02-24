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
import { ShoppingCart02Icon, Calendar02Icon } from "@hugeicons/core-free-icons";
import { addDays, format, differenceInDays } from "date-fns";
import { DateTimeContainer } from "../home/ui/direct-transaction/DataTimeContainer";
import { DirectTransactionCalendar } from "../home/ui/direct-transaction/DirectTransactionCalendar";
import { TimePicker } from "../home/ui/direct-transaction/TimePicker";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { toast } from "sonner";

export function PosCartSection() {
  const {
    items,
    getTotal,
    clearCart,
    globalRentalDates,
    setGlobalDates,
    globalRentalTimes,
    setGlobalTimes,
  } = useCartStore();

  const total = getTotal();

  // ─── MODALES ───
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [reservationOpen, setReservationOpen] = React.useState(false);

  // ─── FECHAS ───
  const pickupDateRef = React.useRef<HTMLButtonElement>(null);
  const pickupTimeRef = React.useRef<HTMLButtonElement>(null);
  const returnDateRef = React.useRef<HTMLButtonElement>(null);
  const returnTimeRef = React.useRef<HTMLButtonElement>(null);

  const businessRules = BUSINESS_RULES_MOCK;
  const [pickupTime, setPickupTime] = React.useState(
    businessRules.openHours.open,
  );
  const [returnTime, setReturnTime] = React.useState(
    businessRules.openHours.close,
  );

  const alquilerItems = items.filter((i) => i.operationType === "alquiler");
  const hasRentals = alquilerItems.length > 0;

  const currentTime = React.useMemo(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }, []);

  React.useEffect(() => {
    if (!globalRentalDates?.from) {
      const today = new Date();
      setGlobalDates({
        from: today,
        to: addDays(today, 3),
      });

      setGlobalTimes({
        pickup: currentTime,
        return: businessRules.openHours.close,
      });
    }
  }, [
    globalRentalDates,
    currentTime,
    setGlobalDates,
    setGlobalTimes,
    businessRules.openHours.close,
  ]);

  const dateRange = React.useMemo(
    () => ({
      from: globalRentalDates?.from,
      to: globalRentalDates?.to,
    }),
    [globalRentalDates],
  );

  let text = "";

  if (hasRentals && !dateRange.to) {
    text = "Seleccione fecha de retorno";
  }

  const days =
    dateRange.from && dateRange.to
      ? differenceInDays(dateRange.to, dateRange.from)
      : 0;

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

      {/* 2. FECHAS GLOBALES (Solo si hay alquileres) */}
      {hasRentals && (
        <div className="p-3  border-b space-y-2">
          <div className="flex items-center gap-1.5 text-blue-700 mb-1">
            <HugeiconsIcon icon={Calendar02Icon} className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Período de Alquiler ({days} {days === 1 ? "día" : "días"})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative opacity-60 pointer-events-none grayscale">
              {/* Le ponemos pointer-events-none para que no se pueda clickear */}
              <DateTimeContainer
                label="Entrega (Hoy)"
                date={dateRange.from}
                time={globalRentalTimes?.pickup || "Ahora"}
                // Quitamos los onClick para que no abra nada
                onDateClick={() => {}}
                onTimeClick={() => {}}
                placeholderDate="Hoy"
                placeholderTime="Ahora"
              />
              {/* No renderizamos el calendario ni el timepicker ocultos aquí */}
            </div>

            <div className="relative">
              <DateTimeContainer
                label="Fin"
                date={dateRange.to}
                time={returnTime}
                onDateClick={() => returnDateRef.current?.click()}
                onTimeClick={() => returnTimeRef.current?.click()}
                placeholderDate="Hasta"
                placeholderTime="Hora"
              />
              <div className="absolute opacity-0 pointer-events-none">
                <DirectTransactionCalendar
                  triggerRef={returnDateRef}
                  selectedDate={dateRange.to}
                  minDate={dateRange.from}
                  mode="return"
                  type="alquiler"
                  quantity={1}
                  cartItems={alquilerItems}
                  onSelect={(d) => {
                    if (d && dateRange.from) {
                      setGlobalDates({
                        from: dateRange.from,
                        to: d,
                      });
                    }
                  }}
                />
                <TimePicker
                  triggerRef={returnTimeRef}
                  value={returnTime}
                  onChange={(t) =>
                    setGlobalTimes({ pickup: pickupTime, return: t })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
            <span>
              {formatCurrency(
                items.reduce(
                  (acc, curr) =>
                    acc + (curr.listPrice || curr.unitPrice) * curr.quantity,
                  0,
                ),
              )}
            </span>
          </div>
          {items.some((i) => (i.discountAmount || 0) > 0) && (
            <div className="flex justify-between text-sm text-emerald-600 font-bold">
              <span>Descuentos</span>
              <span>
                -
                {formatCurrency(
                  items.reduce(
                    (acc, curr) =>
                      acc + (curr.discountAmount || 0) * curr.quantity,
                    0,
                  ),
                )}
              </span>
            </div>
          )}
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
            className="col-span-1 h-full bg-orange-500 text-white hover:bg-orange-600 flex flex-col gap-0.5"
            onClick={() => setReservationOpen(true)}
            disabled={items.length === 0}
          >
            <span className="text-[10px] font-bold uppercase">Reservar</span>
            <span className="text-[9px] opacity-80">(Adelanto)</span>
          </Button>

          <Button
            className={`col-span-3 h-full text-lg text-white font-bold shadow-lg ${hasRentals ? " text-xs bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
            onClick={() => setCheckoutOpen(true)}
            disabled={items.length === 0 || text.length > 0}
          >
            {hasRentals ? (text.length > 0 ? text : "COBRAR") : "COBRAR"}
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
