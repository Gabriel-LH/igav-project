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
import { addDays, setHours, setMinutes, differenceInDays } from "date-fns";
import { ShoppingBag, AlertTriangle, Banknote, Calendar } from "lucide-react";

// --- IMPORTS ---
import { useCartStore } from "@/src/store/useCartStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { CustomerSelector } from "@/src/components/home/ui/reservation/CustomerSelector";
import { CashPaymentSummary } from "@/src/components/home/ui/direct-transaction/CashPaymentSummary";
import { processTransaction } from "@/src/services/transactionServices";
import { manageLoyaltyPoints } from "@/src/services/use-cases/manageLoyaltyPoints";
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
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { UsePointsComponent } from "../ui/UsePointsComponent";
import { CartItem } from "@/src/types/cart/type.cart";
import {
  reserveBundledItems,
  reserveStockUsingInventory,
} from "@/src/services/bundleService";
import { UseCouponComponent } from "../ui/UseCouponComponent";
import { Coupon } from "@/src/types/coupon/type.coupon";
import { useCouponStore } from "@/src/store/useCouponStore";

interface PosCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PosCheckoutModal({
  open,
  onOpenChange,
}: PosCheckoutModalProps) {
  const {
    items,
    clearCart,
    activeTenantId,
    globalRentalDates,
    setGlobalDates,
    globalRentalTimes,
    setGlobalTimes,
  } = useCartStore();

  const businessRules = BUSINESS_RULES_MOCK;
  const sellerId = USER_MOCK[0].id;
  const currentBranchId = USER_MOCK[0].branchId!;

  // ─── ESTADOS ───
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [notes, setNotes] = useState("");

  const [usePoints, setUsePoints] = React.useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Obtenemos al cliente actual desde tu store
  const selectedClient = useCustomerStore((state) =>
    selectedCustomer?.id
      ? state.getCustomerById(selectedCustomer.id)
      : undefined,
  );

  // Configuraciones (Idealmente vienen de tus businessRules)
  const availablePoints = selectedClient?.loyaltyPoints || 0;
  const pointValueInMoney = 0.01; // 1 punto = S/ 0.01

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

  const pickupTime = globalRentalTimes?.pickup || businessRules.openHours.open;
  const returnTime = globalRentalTimes?.return || businessRules.openHours.close;

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
  const getMultiplier = (item: CartItem) =>
    item.operationType === "alquiler" && item.product.rent_unit !== "evento"
      ? Math.max(differenceInDays(dateRange.to, dateRange.from), 1)
      : 1;

  // ─── CÁLCULOS DE PRECIO ───
  const totalVentas = useMemo(
    () => ventaItems.reduce((acc, item) => acc + item.subtotal, 0),
    [ventaItems],
  );

  const totalAlquileres = useMemo(
    () => alquilerItems.reduce((acc, item) => acc + item.subtotal, 0),
    [alquilerItems],
  );

  const IGV_RATE = BUSINESS_RULES_MOCK.taxRate; // 0.18

  const subtotalBruto = items.reduce(
    (acc, item) =>
      acc +
      (item.listPrice ?? item.unitPrice) * item.quantity * getMultiplier(item),
    0,
  );
  const subtotalConPromos = totalVentas + totalAlquileres;
  const pointsConsumed = usePoints
    ? Math.min(
        availablePoints,
        Math.ceil(subtotalConPromos / pointValueInMoney),
      )
    : 0;
  const pointsDiscount = pointsConsumed * pointValueInMoney;

  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") {
      couponDiscount = Math.floor(
        subtotalConPromos * (appliedCoupon.discountValue / 100),
      );
    } else {
      couponDiscount = Math.min(subtotalConPromos, appliedCoupon.discountValue);
    }
  }

  const discountFromItems = Math.max(subtotalBruto - subtotalConPromos, 0);
  const totalDiscount = discountFromItems + pointsDiscount + couponDiscount;
  const totalBrutoConIGV = Math.max(
    subtotalConPromos - pointsDiscount - couponDiscount,
    0,
  );

  // Base imponible (sin IGV)
  const subtotalSinIGV = totalBrutoConIGV / (1 + IGV_RATE);

  // IGV contenido
  const taxAmount = totalBrutoConIGV - subtotalSinIGV;

  // Total final (ya incluye IGV)

  const totalACobrarHoy = useMemo(() => {
    const guaranteeValue =
      guaranteeType === "dinero" ? Number(guarantee || 0) : 0;

    return totalBrutoConIGV + (hasRentals ? guaranteeValue : 0);
  }, [totalBrutoConIGV, guarantee, guaranteeType, hasRentals]);

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

  // ─── VALIDACIONES ───
  const conflicts = useMemo(() => {
    if (!hasRentals) return [];
    const list: string[] = [];

    alquilerItems.forEach((item) => {
      const check = getAvailabilityByAttributes(
        item.product.id,
        item.selectedSizeId || "",
        item.selectedColorId || "",
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
    (i) => i.product.is_serial && i.selectedCodes.length < i.quantity,
  );

  // ─── HANDLER: CONFIRMAR PAGO ───
  const handleConfirm = async () => {
    if (!selectedCustomer) return toast.error("Seleccione un cliente");
    if (conflicts.length > 0)
      return toast.error("Conflictos de stock en fechas seleccionadas");
    if (missingSerials) return toast.error("Faltan asignar series");

    const baseData = {
      tenantId: activeTenantId ?? items[0]?.product.tenantId,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      sellerId,
      branchId: currentBranchId,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setIsProcessing(true);
    try {
      if (items.some((item) => item.bundleId)) {
        const tenantId = activeTenantId ?? items[0]?.product.tenantId;
        if (!tenantId) throw new Error("Tenant no resuelto para bundle");
        await reserveBundledItems(
          items,
          tenantId,
          currentBranchId,
          dateRange.from,
          dateRange.to,
          reserveStockUsingInventory,
        );
      }

      const { stockLots } = useInventoryStore.getState();

      const prepareItems = (
        cartItems: CartItem[],
        opType: "venta" | "alquiler",
      ) => {
        const results: SaleDTO["items"] = [];

        cartItems.forEach((cartItem) => {
          const unitPrice = cartItem.unitPrice;
          const listPrice = cartItem.listPrice ?? unitPrice;
          const discountAmount = cartItem.discountAmount ?? 0;
          const discountReason = cartItem.discountReason;
          const promotionId = cartItem.appliedPromotionId;
          const bundleId = cartItem.bundleId;

          if (cartItem.product.is_serial) {
            cartItem.selectedCodes.forEach((code: string) => {
              results.push({
                productId: cartItem.product.id,
                productName: cartItem.product.name,
                stockId: code,
                quantity: 1,
                sizeId: cartItem.selectedSizeId ?? "",
                colorId: cartItem.selectedColorId ?? "",
                priceAtMoment: unitPrice,
                listPrice,
                discountAmount,
                discountReason,
                promotionId,
                bundleId,
              });
            });

            return;
          }

          let remaining = cartItem.quantity;

          const candidates = stockLots.filter(
            (l) =>
              l.productId === cartItem.product.id &&
              l.sizeId === (cartItem.selectedSizeId || "") &&
              l.colorId === (cartItem.selectedColorId || "") &&
              l.branchId === currentBranchId &&
              (opType === "venta" ? l.isForSale : l.isForRent),
          );

          for (const lot of candidates) {
            if (remaining <= 0) break;

            const take = Math.min(remaining, lot.quantity);

            results.push({
              productId: cartItem.product.id,
              productName: cartItem.product.name,
              stockId: lot.id,
              quantity: take,
              sizeId: cartItem.selectedSizeId ?? "",
              colorId: cartItem.selectedColorId ?? "",
              priceAtMoment: unitPrice,
              listPrice,
              discountAmount,
              discountReason,
              promotionId,
              bundleId,
            });

            remaining -= take;
          }

          if (remaining > 0)
            throw new Error(`Stock insuficiente para ${cartItem.product.name}`);
        });

        return results;
      };

      // A. PROCESAR VENTA
      if (ventaItems.length > 0) {
        const saleDTO: SaleDTO = {
          ...baseData,
          id: "",
          operationId: "",
          type: "venta",
          status: "vendido",

          items: prepareItems(ventaItems, "venta"),

          financials: {
            subtotal: subtotalBruto,
            totalDiscount: totalDiscount,
            taxAmount: taxAmount,
            totalAmount: totalBrutoConIGV,
            keepAsCredit: false,
            receivedAmount:
              paymentMethod === "cash"
                ? Number(receivedAmount) || 0
                : totalBrutoConIGV,
            paymentMethod: paymentMethod as PaymentMethodType,
          },
        };

        await processTransaction(saleDTO);
      }

      if (alquilerItems.length > 0) {
        const guaranteeAmount =
          guaranteeType === "dinero" ? Number(guarantee || 0) : 0;

        const rentalDTO: RentalDTO = {
          ...baseData,
          id: "",
          operationId: "",
          type: "alquiler",
          status: "alquilado",

          startDate: withTime(dateRange.from, pickupTime),
          endDate: withTime(dateRange.to, returnTime),

          items: prepareItems(alquilerItems, "alquiler"),

          financials: {
            subtotal: subtotalBruto,
            totalDiscount: totalDiscount,
            taxAmount: taxAmount,
            totalAmount: totalBrutoConIGV,
            keepAsCredit: false,
            receivedAmount:
              paymentMethod === "cash"
                ? Number(receivedAmount) || 0
                : totalBrutoConIGV + guaranteeAmount,
            paymentMethod: paymentMethod as PaymentMethodType,
          },

          guarantee: {
            type: guaranteeType,
            value: guaranteeType === "dinero" ? guarantee : undefined,
            description: guaranteeType !== "dinero" ? guarantee : undefined,
            amount: guaranteeAmount,
          },
        };

        await processTransaction(rentalDTO);
      }

      if (usePoints && pointsConsumed > 0) {
        manageLoyaltyPoints({
          clientId: selectedCustomer.id,
          points: pointsConsumed,
          type: "redeemed",
          description: "Canje de puntos en POS",
        });
      }

      if (appliedCoupon) {
        useCouponStore.getState().markAsUsed(appliedCoupon.id);
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
            {ventaItems.length > 0 && alquilerItems.length > 0
              ? "la venta y el alquiler"
              : ventaItems.length > 0
                ? "la venta"
                : "el alquiler"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-2 pr-1">
          {/* RESUMEN DE ITEMS */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black text-muted-foreground">
              Resumen del carrito ({items.length} productos)
            </Label>

            {ventaItems.length > 0 && (
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
                <div className="flex justify-between text-xs font-black text-orange-500 pt-1 border-t border-dashed">
                  <span>Subtotal Ventas</span>
                  <span>{formatCurrency(totalVentas)}</span>
                </div>
              </div>
            )}

            {alquilerItems.length > 0 && (
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
                {alquilerItems.map((item) => {
                  const days = Math.max(
                    differenceInDays(dateRange.to, dateRange.from),
                    1,
                  );
                  const isEvent = item.product.rent_unit === "evento";

                  return (
                    <div
                      key={item.cartId}
                      className="flex justify-between text-xs py-1 border-t"
                    >
                      <div className="flex flex-col">
                        <span className="text-slate-200">
                          {item.product.name}{" "}
                          <span className="text-muted-foreground text-[10px]">
                            ×{item.quantity}
                          </span>
                        </span>
                        {!isEvent && (
                          <span className="text-[9px] text-blue-400 font-bold">
                            Alquiler por {days} {days === 1 ? "día" : "días"}
                          </span>
                        )}
                      </div>
                      <span className="font-bold">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-xs font-black text-blue-600 pt-1 border-t border-dashed">
                  <span>Subtotal Alquileres</span>
                  <span>{formatCurrency(totalAlquileres)}</span>
                </div>
              </div>
            )}
          </div>

          {/* FECHAS DE ALQUILER */}
          {hasRentals && (
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-muted-foreground">
                Período de Alquiler
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative pointer-events-none opacity-50">
                  <DateTimeContainer
                    label="Inicio Alquiler"
                    date={dateRange.from}
                    time={pickupTime}
                    onDateClick={() => {}}
                    onTimeClick={() => {}}
                    placeholderDate="Seleccionar"
                    placeholderTime="Hora"
                  />
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
                      type="alquiler"
                      productId=""
                      sizeId=""
                      colorId=""
                      cartItems={items}
                      quantity={1}
                      onSelect={(d) => d && handleDateChange({ to: d })}
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
              {conflicts.length > 0 && (
                <div className="p-2 rounded text-xs border text-red-500 mt-2 flex items-start gap-2">
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

          {hasRentals && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-foreground">
                  Garantía Requerida:
                </span>
                <span className="font-black text-amber-600">
                  Obligatorio registrar garantía
                </span>
              </div>
            </div>
          )}

          <CustomerSelector
            selected={selectedCustomer}
            onSelect={setSelectedCustomer}
          />

          <div className="bg-primary/5 p-3 rounded-lg border-l-2 border-primary">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase">
                Total Operación
              </span>
              <span className="text-xl font-black text-primary">
                {formatCurrency(totalBrutoConIGV)}
              </span>
            </div>
          </div>

          {/* SECCIÓN FIDELIDAD / CUPONES */}
          <div className="pt-2 border-t flex flex-col gap-2">
            {selectedClient && availablePoints > 0 && (
              <UsePointsComponent
                usePoints={usePoints}
                setUsePoints={setUsePoints}
                availablePoints={availablePoints}
                pointValueInMoney={pointValueInMoney}
              />
            )}
            <UseCouponComponent
              tenantId={activeTenantId ?? items[0]?.product.tenantId ?? null}
              selectedClientId={selectedCustomer?.id}
              appliedCoupon={appliedCoupon}
              onApplyCoupon={setAppliedCoupon}
            />
          </div>

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
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleConfirm}
            disabled={items.some(
              (i) =>
                (i.product.is_serial && i.selectedCodes.length < i.quantity) ||
                (hasRentals && Number(receivedAmount) <= 0) ||
                Number(receivedAmount) > totalBrutoConIGV ||
                (hasRentals && guarantee.length === 0),
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
