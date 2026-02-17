"use client";

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { addDays, setHours, setMinutes } from "date-fns";
import { ShoppingBag, AlertTriangle, Banknote, Calendar } from "lucide-react";

// --- IMPORTS ---
import { useCartStore } from "@/src/store/useCartStore";
import { CustomerSelector } from "@/src/components/home/ui/reservation/CustomerSelector";
import { CashPaymentSummary } from "@/src/components/home/ui/direct-transaction/CashPaymentSummary";
import { processTransaction } from "@/src/services/transactionServices";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { formatCurrency } from "@/src/utils/currency-format";
import { SaleDTO } from "@/src/interfaces/SaleDTO";
import { RentalDTO } from "@/src/interfaces/RentalDTO";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";
import { DateTimeContainer } from "@/src/components/home/ui/direct-transaction/DataTimeContainer";
import { DirectTransactionCalendar } from "@/src/components/home/ui/direct-transaction/DirectTransactionCalendar";
import { TimePicker } from "@/src/components/home/ui/direct-transaction/TimePicker";
import { getAvailabilityByAttributes } from "@/src/utils/reservation/checkAvailability";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge03Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/badge";
import { PaymentMethodType } from "@/src/utils/status-type/PaymentMethodType";

interface PosCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PosCheckoutModal({
  open,
  onOpenChange,
}: PosCheckoutModalProps) {
  const { items, clearCart, globalRentalDates, setGlobalDates } =
    useCartStore();

  const businessRules = BUSINESS_RULES_MOCK;
  const sellerId = USER_MOCK[0].id;
  const currentBranchId = USER_MOCK[0].branchId;

  // ─── ESTADOS ───
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [notes, setNotes] = useState("");

  // Fechas de alquiler
  const pickupDateRef = React.useRef<HTMLButtonElement>(null);
  const pickupTimeRef = React.useRef<HTMLButtonElement>(null);
  const returnDateRef = React.useRef<HTMLButtonElement>(null);
  const returnTimeRef = React.useRef<HTMLButtonElement>(null);

  // Sincronizamos fecha local con global
  const dateRange = useMemo(
    () => ({
      from: globalRentalDates?.from || new Date(),
      to: globalRentalDates?.to || addDays(new Date(), 3),
    }),
    [globalRentalDates],
  );

  // Handler para actualizar fecha global desde este modal
  const handleDateChange = (newRange: { from?: Date; to?: Date }) => {
    setGlobalDates({
      from: newRange.from || dateRange.from,
      to: newRange.to || dateRange.to,
    });
  };

  const [pickupTime, setPickupTime] = useState(businessRules.openHours.open);
  const [returnTime, setReturnTime] = useState(businessRules.openHours.close);

  // Financieros
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "transfer" | "yape" | "plin"
  >("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [guarantee, setGuarantee] = useState("");
  const [guaranteeType, setGuaranteeType] = useState<GuaranteeType>("dinero");

  const [isProcessing, setIsProcessing] = useState(false);

  // ─── CLASIFICACIÓN DE ITEMS ───
  const ventaItems = useMemo(
    () => items.filter((i) => i.operationType === "venta"),
    [items],
  );
  const alquilerItems = useMemo(
    () => items.filter((i) => i.operationType === "alquiler"),
    [items],
  );

  const hasRentals = alquilerItems.length > 0;
  const hasSales = ventaItems.length > 0;

  // ─── CÁLCULOS DE PRECIO ───
  const totalVentas = useMemo(
    () => ventaItems.reduce((acc, item) => acc + item.subtotal, 0),
    [ventaItems],
  );

  const totalAlquileres = useMemo(() => {
    if (!hasRentals) return 0;
    const diffTime = Math.abs(
      dateRange.to.getTime() - dateRange.from.getTime(),
    );
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    return alquilerItems.reduce((acc, item) => {
      const isEvent = item.product.rent_unit === "evento";
      const multiplier = isEvent ? 1 : days;
      return acc + item.unitPrice * item.quantity * multiplier;
    }, 0);
  }, [alquilerItems, dateRange, hasRentals]);

  const totalOperacion = totalVentas + totalAlquileres;

  const totalACobrarHoy = useMemo(() => {
    const guaranteeValue =
      guaranteeType === "dinero" ? Number(guarantee || 0) : 0;
    return totalOperacion + (hasRentals ? guaranteeValue : 0);
  }, [totalOperacion, guarantee, guaranteeType, hasRentals]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== "cash") return 0;
    const received = Number(receivedAmount);
    if (received <= 0 || received < totalACobrarHoy) return 0;
    return received - totalACobrarHoy;
  }, [receivedAmount, totalACobrarHoy, paymentMethod]);

  const withTime = (date: Date, time: string) => {
    const [h, m] = time.split(":").map(Number);
    return setMinutes(setHours(date, h), m);
  };

  // ─── VALIDACIONES (Lógica Robusta) ───
  const conflicts = useMemo(() => {
    if (!hasRentals) return [];
    const list: string[] = [];

    alquilerItems.forEach((item) => {
      const check = getAvailabilityByAttributes(
        item.product.id,
        item.selectedSize || "",
        item.selectedColor || "",
        dateRange.from,
        dateRange.to,
        "alquiler",
      );

      if (item.quantity > check.availableCount) {
        list.push(
          `${item.product.name}: Solicitado ${item.quantity}, Disponible ${check.availableCount}`,
        );
      }
    });
    return list;
  }, [alquilerItems, dateRange, hasRentals]);

  const missingSerials = items.some(
    (i) => i.product.is_serial && i.selectedStockIds.length < i.quantity,
  );

  // ─── HANDLER: CONFIRMAR PAGO ───
  const handleConfirm = async () => {
    if (!selectedCustomer) return toast.error("Seleccione un cliente");
    if (conflicts.length > 0)
      return toast.error("Conflictos de stock en fechas seleccionadas");
    if (missingSerials) return toast.error("Faltan asignar series");

    const baseData = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      sellerId,
      branchId: currentBranchId,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(), // Cumple contrato DTO
    };

    setIsProcessing(true);
    try {
      // A. PROCESAR VENTA
      if (hasSales) {
        const saleDTO: SaleDTO = {
          ...baseData,
          type: "venta",
          status: "vendido",
          items: ventaItems.map((i) => ({
            productId: i.product.id,
            productName: i.product.name,
            quantity: i.quantity,
            stockId: i.selectedStockIds[0], // ID Físico
            priceAtMoment: i.unitPrice,
            size: i.selectedSize ?? "",
            color: i.selectedColor ?? "",
          })),
          financials: {
            totalAmount: totalVentas,
            paymentMethod: paymentMethod as PaymentMethodType,
            receivedAmount: Number(receivedAmount),
            keepAsCredit: false,
            totalPrice: totalVentas,
            downPayment: 0,
          },
          id: "", // Placeholder
          operationId: "", // Placeholder
        };
        await processTransaction(saleDTO);
      }

      // B. PROCESAR ALQUILER
      if (hasRentals) {
        const rentalDTO: RentalDTO = {
          ...baseData,
          type: "alquiler",
          status: "alquilado",
          startDate: withTime(dateRange.from, pickupTime),
          endDate: withTime(dateRange.to, returnTime),
          items: alquilerItems.map((i) => ({
            productId: i.product.id,
            productName: i.product.name,
            quantity: i.quantity,
            stockId: i.selectedStockIds[0], // ID Físico
            priceAtMoment: i.unitPrice,
            size: i.selectedSize ?? "",
            color: i.selectedColor ?? "",
          })),
          financials: {
            totalRent: totalAlquileres,
            paymentMethod: paymentMethod as PaymentMethodType,
            receivedAmount: hasSales ? 0 : Number(receivedAmount), // Si es mixto, asumimos pago va a venta
            keepAsCredit: false,
            guarantee: {
              type: guaranteeType,
              value: guaranteeType === "dinero" ? guarantee : undefined,
              description: guaranteeType !== "dinero" ? guarantee : undefined,
            },
          },
          id: "", // Placeholder
          operationId: "", // Placeholder
        };
        await processTransaction(rentalDTO);
      }

      toast.success("Operación exitosa");
      clearCart();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Error al procesar");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-dvh sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="uppercase text-sm font-black flex items-center gap-2 text-emerald-600">
            <Banknote className="w-5 h-5" />
            Cobrar — Transacción Directa
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Confirma el pago total para procesar{" "}
            {hasSales && hasRentals
              ? "la venta y el alquiler"
              : hasSales
                ? "la venta"
                : "el alquiler"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-2 pr-1">
          {/* ─── RESUMEN DE ITEMS ─── */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black text-muted-foreground">
              Resumen del carrito ({items.length} productos)
            </Label>

            {/* VENTAS */}
            {hasSales && (
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-black uppercase text-orange-500">
                    Ventas
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-orange-400 text-[10px]"
                  >
                    {ventaItems.length} prod.
                  </Badge>
                </div>
                {ventaItems.map((item) => (
                  <div
                    key={item.cartId}
                    className="flex justify-between text-xs py-1 border-t "
                  >
                    <span className="text-slate-300">
                      {item.product.name}{" "}
                      <span className="text-muted-foreground">
                        ×{item.quantity}
                      </span>
                    </span>
                    <span className="font-bold">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-black text-orange-500 pt-1  border-t border-dashed">
                  <span>Subtotal Ventas</span>
                  <span>{formatCurrency(totalVentas)}</span>
                </div>
              </div>
            )}

            {/* ALQUILERES */}
            {hasRentals && (
              <div className="border rounded-lg p-3 ">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-black uppercase text-blue-500">
                    Alquileres
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-blue-400 text-[10px]"
                  >
                    {alquilerItems.length} prod.
                  </Badge>
                </div>
                {alquilerItems.map((item) => (
                  <div
                    key={item.cartId}
                    className="flex justify-between text-xs py-1 border-t"
                  >
                    <span className="text-slate-200">
                      {item.product.name}{" "}
                      <span className="text-muted-foreground">
                        ×{item.quantity}
                      </span>
                    </span>
                    <span className="font-bold">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-black text-blue-600 pt-1 border-t border-dashed">
                  <span>Subtotal Alquileres</span>
                  <span>{formatCurrency(totalAlquileres)}</span>
                </div>
              </div>
            )}
          </div>

          {/* ─── FECHAS DE ALQUILER ─── */}
          {hasRentals && (
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-muted-foreground">
                Período de Alquiler
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <DateTimeContainer
                    label="Inicio Alquiler"
                    date={dateRange.from}
                    time={pickupTime}
                    onDateClick={() => pickupDateRef.current?.click()}
                    onTimeClick={() => pickupTimeRef.current?.click()}
                    placeholderDate="Seleccionar"
                    placeholderTime="Hora"
                  />
                  <div className="absolute opacity-0 pointer-events-none top-0">
                    <DirectTransactionCalendar
                      triggerRef={pickupDateRef}
                      selectedDate={dateRange.from}
                      mode="pickup"
                      productId=""
                      size=""
                      color=""
                      quantity={1}
                      type="alquiler"
                      onSelect={(d) => d && handleDateChange({ from: d })}
                    />
                    <TimePicker
                      triggerRef={pickupTimeRef}
                      value={pickupTime}
                      onChange={setPickupTime}
                    />
                  </div>
                </div>

                <div className="relative">
                  <DateTimeContainer
                    label="Fecha Devolución"
                    date={dateRange.to}
                    time={returnTime}
                    onDateClick={() => returnDateRef.current?.click()}
                    onTimeClick={() => returnTimeRef.current?.click()}
                    placeholderDate="Seleccionar"
                    placeholderTime="Hora"
                  />
                  <div className="absolute opacity-0 pointer-events-none top-0">
                    <DirectTransactionCalendar
                      triggerRef={returnDateRef}
                      selectedDate={dateRange.to}
                      minDate={dateRange.from}
                      mode="return"
                      productId=""
                      size=""
                      color=""
                      quantity={1}
                      type="alquiler"
                      onSelect={(d) => d && handleDateChange({ to: d })}
                    />
                    <TimePicker
                      triggerRef={returnTimeRef}
                      value={returnTime}
                      onChange={setReturnTime}
                    />
                  </div>
                </div>
              </div>
              {conflicts.length > 0 && (
                <div className="p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700 mt-2 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Conflictos de Disponibilidad:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {conflicts.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── CLIENTE ─── */}
          <CustomerSelector
            selected={selectedCustomer}
            onSelect={setSelectedCustomer}
          />

          {/* ─── TOTAL GENERAL ─── */}
          <div className="bg-primary/5 p-3 rounded-lg border-l-2 border-primary">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase">
                Total Operación
              </span>
              <span className="text-xl font-black text-primary">
                {formatCurrency(totalOperacion)}
              </span>
            </div>
          </div>

          {/* ─── PAGO ─── */}
          <CashPaymentSummary
            type={hasRentals ? "alquiler" : "venta"}
            totalToPay={totalACobrarHoy}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            receivedAmount={receivedAmount}
            setReceivedAmount={setReceivedAmount}
            changeAmount={changeAmount}
            guarantee={guarantee}
            setGuarantee={setGuarantee}
            guaranteeType={guaranteeType}
            setGuaranteeType={setGuaranteeType}
          />

          {/* ─── WARNINGS SERIALIZADOS ─── */}
          {items.some(
            (i) =>
              i.product.is_serial && i.selectedStockIds.length < i.quantity,
          ) && (
            <div className="flex items-start gap-2 p-3 border border-amber-800 animate-pulse rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-600">
                <strong className="text-amber-400">Atención:</strong> Algunos
                productos serializados no tienen stock asignado aún. Asígnalos
                desde el carrito antes de cobrar.
              </p>
            </div>
          )}
        </div>

        {/* ─── BOTÓN CONFIRMAR ─── */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleConfirm}
            disabled={items.some(
              (i) =>
                i.product.is_serial && i.selectedStockIds.length < i.quantity,
            )}
            className="w-full h-12 font-black text-white bg-linear-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 shadow-lg"
          >
            <HugeiconsIcon
              icon={CheckmarkBadge03Icon}
              className="w-5 h-5 mr-2"
            />
            {isProcessing
              ? "PROCESANDO..."
              : missingSerials
                ? "ASIGNAR SERIES EN CARRITO"
                : `CONFIRMAR COBRO — ${formatCurrency(totalACobrarHoy)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
