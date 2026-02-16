"use client";

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/badge";
import { toast } from "sonner";
import { addDays } from "date-fns";
import {
  ShoppingBag,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Banknote,
} from "lucide-react";

import { useCartStore } from "@/src/store/useCartStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { CustomerSelector } from "@/src/components/home/ui/reservation/CustomerSelector";
import { CashPaymentSummary } from "@/src/components/home/ui/direct-transaction/CashPaymentSummary";
import { PriceBreakdownBase } from "@/src/components/pricing/PriceBreakdownBase";
import { processTransaction } from "@/src/services/transactionServices";
import { usePriceCalculation } from "@/src/hooks/usePriceCalculation";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { formatCurrency } from "@/src/utils/currency-format";
import { CartItem } from "@/src/types/cart/type.cart";
import { SaleDTO } from "@/src/interfaces/SaleDTO";
import { RentalDTO } from "@/src/interfaces/RentalDTO";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";
import { DateTimeContainer } from "@/src/components/home/ui/direct-transaction/DataTimeContainer";
import { DirectTransactionCalendar } from "@/src/components/home/ui/direct-transaction/DirectTransactionCalendar";
import { TimePicker } from "@/src/components/home/ui/direct-transaction/TimePicker";
import { setHours, setMinutes } from "date-fns";

interface PosCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PosCheckoutModal({
  open,
  onOpenChange,
}: PosCheckoutModalProps) {
  const { items, clearCart, globalRentalDates } = useCartStore();
  const allStock = useInventoryStore((s) => s.stock);

  const businessRules = BUSINESS_RULES_MOCK;
  const sellerId = USER_MOCK[0].id;
  const currentBranchId = USER_MOCK[0].branchId;

  // ─── ESTADOS ───
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [notes, setNotes] = React.useState("");

  // Fechas de alquiler
  const pickupDateRef = React.useRef<HTMLButtonElement>(null);
  const pickupTimeRef = React.useRef<HTMLButtonElement>(null);
  const returnDateRef = React.useRef<HTMLButtonElement>(null);
  const returnTimeRef = React.useRef<HTMLButtonElement>(null);

  const [dateRange, setDateRange] = React.useState<any>({
    from: globalRentalDates?.from || new Date(),
    to: globalRentalDates?.to || addDays(new Date(), 3),
  });

  const [pickupTime, setPickupTime] = React.useState(
    businessRules.openHours.open,
  );
  const [returnTime, setReturnTime] = React.useState(
    businessRules.openHours.close,
  );

  // Financieros
  const [paymentMethod, setPaymentMethod] = React.useState<
    "cash" | "card" | "transfer" | "yape" | "plin"
  >("cash");
  const [receivedAmount, setReceivedAmount] = React.useState("");
  const [guarantee, setGuarantee] = React.useState("");
  const [guaranteeType, setGuaranteeType] =
    React.useState<GuaranteeType>("dinero");

  const [checklist, setChecklist] = React.useState({
    deliverAfter: false,
    guaranteeAfter: false,
  });

  // ─── SEPARAR POR TIPO ───
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
    () => ventaItems.reduce((sum, i) => sum + i.subtotal, 0),
    [ventaItems],
  );
  const totalAlquileres = useMemo(() => {
    if (!hasRentals) return 0;
    // Para alquileres, recalcular con días
    const days =
      dateRange?.from && dateRange?.to
        ? Math.max(
            Math.ceil(
              (dateRange.to.getTime() - dateRange.from.getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1,
            1,
          )
        : 1;
    return alquilerItems.reduce((sum, item) => {
      const rentUnit = item.product.rent_unit;
      const isEvent = rentUnit === "evento";
      return sum + item.unitPrice * item.quantity * (isEvent ? 1 : days);
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
    if (Number(receivedAmount) <= 0) return 0;
    if (Number(receivedAmount) < totalACobrarHoy) return 0;
    return Number(receivedAmount) - totalACobrarHoy;
  }, [receivedAmount, totalACobrarHoy, paymentMethod]);

  const withTime = (date: Date, time: string) => {
    const [h, m] = time.split(":").map(Number);
    return setMinutes(setHours(date, h), m);
  };

  // ─── VALIDAR Y CONSTRUIR ITEMS ───
  const buildTransactionItems = (cartItems: CartItem[]) => {
    const transactionItems: any[] = [];

    for (const cartItem of cartItems) {
      const isVenta = cartItem.operationType === "venta";

      if (cartItem.product.is_serial) {
        // SERIALIZADO: exigir IDs seleccionados
        if (cartItem.selectedStockIds.length < cartItem.quantity) {
          toast.error(
            `"${cartItem.product.name}": Debes asignar ${cartItem.quantity} unidades serializadas (tienes ${cartItem.selectedStockIds.length}).`,
          );
          return null;
        }
        for (const stockId of cartItem.selectedStockIds) {
          transactionItems.push({
            productId: cartItem.product.id,
            productName: cartItem.product.name,
            stockId,
            quantity: 1,
            size: "", // POS no filtra por talla, se resuelve del stock
            color: "",
            priceAtMoment: cartItem.unitPrice,
          });
        }
      } else {
        // NO SERIALIZADO: auto-asignar FIFO
        const candidates = allStock.filter((s) => {
          const isBaseMatch =
            String(s.productId) === String(cartItem.product.id) &&
            s.status === "disponible";
          if (!isBaseMatch) return false;
          return isVenta ? s.isForSale === true : s.isForRent === true;
        });

        let remaining = cartItem.quantity;
        for (const stock of candidates) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, stock.quantity);
          transactionItems.push({
            productId: cartItem.product.id,
            productName: cartItem.product.name,
            stockId: stock.id,
            quantity: take,
            size: stock.size,
            color: stock.color,
            priceAtMoment: cartItem.unitPrice,
          });
          remaining -= take;
        }

        if (remaining > 0) {
          toast.error(
            `"${cartItem.product.name}": Stock insuficiente. Faltan ${remaining} unidades.`,
          );
          return null;
        }
      }
    }

    return transactionItems;
  };

  // ─── CONFIRMAR ───
  const handleConfirm = () => {
    if (!selectedCustomer) return toast.error("Seleccione un cliente");
    if (items.length === 0) return toast.error("El carrito está vacío");

    if (hasRentals && (!dateRange?.from || !dateRange?.to)) {
      return toast.error("Seleccione fechas de alquiler");
    }

    const baseData = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      sellerId,
      branchId: currentBranchId,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // PROCESAR VENTAS
    if (hasSales) {
      const saleItems = buildTransactionItems(ventaItems);
      if (!saleItems) return; // Error ya mostrado

      const saleData: SaleDTO = {
        ...baseData,
        type: "venta",
        status: checklist.deliverAfter
          ? "vendido_pendiente_entrega"
          : "vendido",
        items: saleItems,
        financials: {
          totalAmount: totalVentas,
          paymentMethod,
          receivedAmount: Number(receivedAmount),
          keepAsCredit: false,
          totalPrice: totalVentas,
          downPayment: 0,
        },
        id: "",
        operationId: "",
      };

      processTransaction(saleData);
    }

    // PROCESAR ALQUILERES
    if (hasRentals) {
      const rentalItems = buildTransactionItems(alquilerItems);
      if (!rentalItems) return; // Error ya mostrado

      const rentalData: RentalDTO = {
        ...baseData,
        type: "alquiler",
        status: checklist.deliverAfter ? "reservado_fisico" : "alquilado",
        startDate: withTime(dateRange.from, pickupTime),
        endDate: withTime(dateRange.to, returnTime),
        items: rentalItems,
        financials: {
          totalRent: totalAlquileres,
          paymentMethod,
          receivedAmount: Number(receivedAmount),
          keepAsCredit: false,
          guarantee: {
            type: !checklist.guaranteeAfter ? guaranteeType : "por_cobrar",
            value: guaranteeType === "dinero" ? guarantee : undefined,
            description: guaranteeType !== "dinero" ? guarantee : undefined,
          },
        },
        id: "",
        operationId: "",
      };

      processTransaction(rentalData);
    }

    // ÉXITO
    const msgs: string[] = [];
    if (hasSales) msgs.push("Venta");
    if (hasRentals) msgs.push("Alquiler");
    toast.success(`${msgs.join(" + ")} procesado correctamente`);

    clearCart();
    onOpenChange(false);
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
                      onSelect={(date: Date | undefined) => {
                        if (date) setDateRange({ ...dateRange, from: date });
                      }}
                      mode="pickup"
                      productId=""
                      size=""
                      color=""
                      quantity={1}
                      type="alquiler"
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
                      minDate={dateRange.from}
                      selectedDate={dateRange.to}
                      onSelect={(date: Date | undefined) => {
                        if (date) setDateRange({ ...dateRange, to: date });
                      }}
                      mode="return"
                      type="alquiler"
                      productId=""
                      size=""
                      color=""
                      quantity={1}
                    />
                    <TimePicker
                      triggerRef={returnTimeRef}
                      value={returnTime}
                      onChange={setReturnTime}
                    />
                  </div>
                </div>
              </div>
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
            checklist={checklist}
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
            <CheckCircle2 className="w-5 h-5 mr-2" />
            CONFIRMAR COBRO — {formatCurrency(totalACobrarHoy)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
