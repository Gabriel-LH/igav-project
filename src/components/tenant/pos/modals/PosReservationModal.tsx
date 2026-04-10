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
import { toast } from "sonner";
import { Calendar02Icon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useScrollIndicator } from "@/src/utils/scroll/useScrollIndicator";
import { processTransactionAction } from "@/src/app/(tenant)/tenant/actions/transaction.actions";
import { getAvailablePaymentMethodsAction } from "@/src/app/(tenant)/tenant/actions/payment-method.actions";
import { authClient } from "@/src/lib/auth-client";

import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useCartStore } from "@/src/store/useCartStore";
import { useBranchStore } from "@/src/store/useBranchStore";
import { CustomerSelector } from "@/src/components/tenant/home/ui/reservation/CustomerSelector";
import { formatCurrency } from "@/src/utils/currency-format";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, ShoppingBag } from "lucide-react";
import { PriceSummary } from "@/src/components/tenant/home/ui/reservation/PriceSummary";
import { DateRangePickerContainer } from "@/src/components/tenant/home/ui/reservation/DateRangePickerContainer";
import { DateTimeContainer } from "@/src/components/tenant/home/ui/direct-transaction/DataTimeContainer";
import { ReservationCalendar } from "@/src/components/tenant/home/ui/reservation/ReservationCalendar";
import { TimePicker } from "@/src/components/tenant/home/ui/direct-transaction/TimePicker";

interface PosReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PosReservationModal({
  open,
  onOpenChange,
}: PosReservationModalProps) {
  const { items, clearCart } = useCartStore();
  const { productVariants } = useInventoryStore();

  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
  const scrollRef = useScrollIndicator();

  const { data: session } = authClient.useSession();
  const sellerId = session?.user?.id || "";
  const currentBranchId = selectedBranchId || "";

  // ─── ESTADOS (Iguales al Home) ───
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [notes, setNotes] = React.useState("");
  const [operationType, setOperationType] = React.useState<"alquiler" | "venta">("alquiler");

  // Fechas y Tiempos
  const [dateRange, setDateRange] = React.useState<any>({
    from: new Date(),
    to: addDays(new Date(), 3),
  });
  const [pickupTime, setPickupTime] = React.useState("09:00");
  const [returnTime, setReturnTime] = React.useState("19:00");

  const pickupDateRef = React.useRef<HTMLButtonElement>(null);
  const pickupTimeRef = React.useRef<HTMLButtonElement>(null);
  const returnTimeRef = React.useRef<HTMLButtonElement>(null);

  // Finanzas
  const [downPayment, setDownPayment] = React.useState("");
  const [amountPaid, setAmountPaid] = React.useState("");
  const [keepAsCredit, setKeepAsCredit] = React.useState(false);
  const [paymentMethods, setPaymentMethods] = React.useState<any[]>([]);
  const [paymentMethodId, setPaymentMethodId] = React.useState("");

  const alquilerItems = useMemo(() => items.filter(i => i.operationType === "alquiler"), [items]);
  const ventaItems = useMemo(() => items.filter(i => i.operationType === "venta"), [items]);
  const hasRentals = alquilerItems.length > 0;
  const hasSales = ventaItems.length > 0;

  const totalOperacion = useMemo(() => items.reduce((acc, i) => acc + i.subtotal, 0), [items]);
  const totalAlquileres = useMemo(() => alquilerItems.reduce((acc, i) => acc + i.subtotal, 0), [alquilerItems]);
  const totalVentas = useMemo(() => ventaItems.reduce((acc, i) => acc + i.subtotal, 0), [ventaItems]);

  React.useEffect(() => {
    if (hasRentals && !hasSales && operationType !== "alquiler") {
      setOperationType("alquiler");
    } else if (hasSales && !hasRentals && operationType !== "venta") {
      setOperationType("venta");
    }
  }, [hasRentals, hasSales, operationType]);

  React.useEffect(() => {
    const loadPaymentMethods = async () => {
      const result = await getAvailablePaymentMethodsAction();
      if (result.success && result.data) {
        setPaymentMethods(result.data);
        if (!paymentMethodId) setPaymentMethodId(result.data[0]?.id || "");
      }
    };
    if (open) loadPaymentMethods();
  }, [open, paymentMethodId]);

  const handleConfirm = async () => {
    if (!selectedCustomer || !dateRange?.from) return toast.error("Faltan datos obligatorios");

    try {
      const totalDP = parseFloat(downPayment) || 0;
      const saleShare = totalOperacion > 0 ? totalVentas / totalOperacion : 0;
      const saleDP = Math.round(totalDP * saleShare * 100) / 100;
      const rentalDP = Math.round((totalDP - saleDP) * 100) / 100;

      if (hasSales) {
        const saleDTO: any = {
          branchId: currentBranchId,
          type: "reserva",
          operationType: "venta",
          customerId: selectedCustomer.id,
          sellerId,
          notes: notes + (hasRentals ? " (Parte de operación mixta)" : ""),
          financials: {
            totalAmount: totalVentas,
            downPayment: saleDP,
            receivedAmount: saleDP,
            paymentMethod: paymentMethodId,
          },
          reservationDateRange: {
            from: startOfDay(dateRange.from),
            to: endOfDay(dateRange.from),
            hourFrom: pickupTime,
          },
          items: ventaItems.map(i => ({
            productId: i.product.id,
            productName: i.product.name,
            variantId: i.variantId,
            quantity: i.quantity,
            priceAtMoment: i.unitPrice,
            subtotal: i.subtotal,
          })),
        };
        const res = await processTransactionAction(saleDTO);
        if (!res.success) throw new Error(res.error);
      }

      if (hasRentals) {
        const rentalDTO: any = {
          branchId: currentBranchId,
          type: "reserva",
          operationType: "alquiler",
          customerId: selectedCustomer.id,
          sellerId,
          notes: notes + (hasSales ? " (Parte de operación mixta)" : ""),
          financials: {
            totalAmount: totalAlquileres,
            downPayment: rentalDP,
            receivedAmount: rentalDP,
            paymentMethod: paymentMethodId,
          },
          reservationDateRange: {
            from: startOfDay(dateRange.from),
            to: endOfDay(dateRange.to || dateRange.from),
            hourFrom: pickupTime,
          },
          items: alquilerItems.map(i => ({
            productId: i.product.id,
            productName: i.product.name,
            variantId: i.variantId,
            quantity: i.quantity,
            priceAtMoment: i.unitPrice,
            subtotal: i.subtotal,
          })),
        };
        const res = await processTransactionAction(rentalDTO);
        if (!res.success) throw new Error(res.error);
      }

      toast.success("Reserva creada con éxito");
      clearCart();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error al crear la reserva");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-dvh sm:max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="mb-4">
          <DialogTitle className="uppercase text-sm font-black flex items-center gap-2">
            {operationType === "alquiler" ? (
              <span className="flex items-center gap-2 text-blue-500">
                <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
                Reserva de Alquiler
              </span>
            ) : (
              <span className="flex items-center gap-2 text-orange-500">
                <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} />
                Reserva de Venta
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs font-bold uppercase tracking-tight">
            Gestión de Reserva POS • Bolsa ({items.length} ítems)
          </DialogDescription>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-1 custom-scrollbar space-y-6 pb-6"
        >
          {/* SELECTOR DE MODO (Solo si es mixto) */}
          {hasSales && hasRentals && (
            <Tabs
              value={operationType}
              onValueChange={(val: any) => setOperationType(val)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-muted/30 border rounded-2xl p-1 h-11">
                <TabsTrigger
                  value="alquiler"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl flex gap-1 items-center font-bold text-xs"
                >
                  <CalendarDays className="w-3.5 h-3.5" /> Alquiler
                </TabsTrigger>
                <TabsTrigger
                  value="venta"
                  className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-xl flex gap-1 items-center font-bold text-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Venta
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* LISTA DE ITEMS (Adaptación del bloque de info original) */}
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-black opacity-50 ml-1">Bolsa de Productos</Label>
            <div className="space-y-2">
              {items.map((item, idx) => {
                const variant = productVariants.find(v => v.id === item.variantId);
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-muted/50 transition-colors hover:bg-muted/50">
                    <div className="w-10 h-10 rounded-lg border bg-white flex items-center justify-center font-bold text-[10px] uppercase text-primary shrink-0 shadow-sm">
                      {variant?.attributes?.size || "S/T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold uppercase truncate">{item.product.name}</h4>
                      <p className="text-[9px] text-muted-foreground font-medium opacity-70">
                        {item.operationType === "alquiler" ? "Alquiler" : "Venta"} | Cant: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black tabular-nums">{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CALENDARIO Y TIEMPO (Diseño idéntico al Home) */}
          <div className="relative">
            {operationType === "alquiler" ? (
              <div className="relative">
                <DateRangePickerContainer
                  label="Periodo de Alquiler y Horas"
                  fromDate={dateRange?.from}
                  toDate={dateRange?.to}
                  fromTime={pickupTime}
                  toTime={returnTime}
                  onDateClick={() => pickupDateRef.current?.click()}
                  onFromTimeClick={() => pickupTimeRef.current?.click()}
                  onToTimeClick={() => returnTimeRef.current?.click()}
                />
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <ReservationCalendar
                    triggerRef={pickupDateRef}
                    mode="range"
                    originBranchId={currentBranchId}
                    currentBranchId={currentBranchId}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    rules={null}
                    productId={items[0]?.product.id}
                    variantId={items[0]?.variantId}
                    quantity={1}
                    type="alquiler"
                  />
                  <div className="absolute left-0 bottom-0 w-1/2 h-1/2">
                    <TimePicker triggerRef={pickupTimeRef} value={pickupTime} onChange={setPickupTime} />
                  </div>
                  <div className="absolute right-0 bottom-0 w-1/2 h-1/2">
                    <TimePicker triggerRef={returnTimeRef} value={returnTime} onChange={setReturnTime} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <DateTimeContainer
                  label="Fecha de Entrega"
                  date={dateRange?.from}
                  time={pickupTime}
                  onDateClick={() => pickupDateRef.current?.click()}
                  onTimeClick={() => pickupTimeRef.current?.click()}
                  placeholderDate="Seleccionar fecha"
                  placeholderTime="Seleccionar hora"
                />
                <div className="absolute inset-0 pointer-events-none">
                  <ReservationCalendar
                    triggerRef={pickupDateRef}
                    mode="single"
                    originBranchId={currentBranchId}
                    currentBranchId={currentBranchId}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    rules={null}
                    productId={items[0]?.product.id}
                    variantId={items[0]?.variantId}
                    type="venta"
                  />
                  <div className="absolute right-0 bottom-0 w-1/2 h-1/2">
                    <TimePicker triggerRef={pickupTimeRef} value={pickupTime} onChange={setPickupTime} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CLIENTE */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black opacity-50 ml-1 tracking-wider">Cliente Responsable</Label>
            <CustomerSelector
              selected={selectedCustomer}
              onSelect={setSelectedCustomer}
            />
          </div>

          {/* NOTAS */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black opacity-50 ml-1 tracking-wider">Notas de Reserva</Label>
            <Textarea
              placeholder="Ej: El cliente solicita ajuste especial..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl min-h-[80px]"
            />
          </div>

          {/* RESUMEN FINANCIERO (Premium PriceSummary) */}
          <div className="pt-2">
            {(() => {
              const currentItems = operationType === "alquiler" ? alquilerItems : ventaItems;
              const totalQty = currentItems.reduce((acc, i) => acc + i.quantity, 0);
              const totalAmount = currentItems.reduce((acc, i) => acc + i.subtotal, 0);
              const effectivePrice = totalQty > 0 ? totalAmount / totalQty : 0;

              return (
                <PriceSummary
                  item={items[0]?.product} 
                  operationType={operationType}
                  startDate={dateRange?.from || new Date()}
                  endDate={dateRange?.to || dateRange?.from || new Date()}
                  priceSell={operationType === "venta" ? effectivePrice : 0}
                  priceRent={operationType === "alquiler" ? effectivePrice : 0}
                  quantity={totalQty}
                  downPayment={downPayment}
                  setDownPayment={setDownPayment}
                  amountPaid={amountPaid}
                  setAmountPaid={setAmountPaid}
                  keepAsCredit={keepAsCredit}
                  setKeepAsCredit={setKeepAsCredit}
                  paymentMethodId={paymentMethodId}
                  setPaymentMethodId={setPaymentMethodId}
                  paymentMethods={paymentMethods}
                  isCashPayment={paymentMethods.find(m => m.id === paymentMethodId)?.type === "cash"}
                />
              );
            })()}
          </div>
        </div>

        {/* ACCIÓN (Estilo Home) */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleConfirm}
            className={`w-full h-12 font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all active:scale-95 ${
              operationType === "alquiler"
                ? "bg-linear-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white"
                : "bg-linear-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white"
            }`}
            disabled={!selectedCustomer || items.length === 0}
          >
            CONFIRMAR RESERVA
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
