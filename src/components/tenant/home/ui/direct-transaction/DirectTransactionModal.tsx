import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CustomerSelector } from "../reservation/CustomerSelector";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { Label } from "@/components/label";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar02Icon,
  SaleTag02Icon,
  Warning,
} from "@hugeicons/core-free-icons";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Input } from "@/components/input";
import { RentalDTO } from "@/src/application/dtos/RentalDTO";
import { SaleDTO } from "@/src/application/dtos/SaleDTO";

import { PriceBreakdownBase } from "@/src/components/tenant/pricing/PriceBreakdownBase";
import { CashPaymentSummary } from "./CashPaymentSummary";
import { processTransactionAction } from "@/src/app/(tenant)/tenant/actions/transaction.actions";
import { getAvailablePaymentMethodsAction } from "@/src/app/(tenant)/tenant/actions/payment-method.actions";
import { getAvailabilityCalendarDataAction } from "@/src/app/(tenant)/tenant/actions/availability.actions";
import { usePriceCalculation } from "@/src/hooks/usePriceCalculation";
import { authClient } from "@/src/lib/auth-client";
// ... placeholder, will search first ...
import { DialogDescription } from "@/components/ui/dialog";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";
import { DirectTransactionCalendar } from "./DirectTransactionCalendar";
import { MOCK_BRANCH_CONFIG } from "@/src/mocks/mock.branchConfig";
import { Field, FieldGroup } from "@/components/ui/field";
import { Checkbox } from "@/components/checkbox";
import { TimePicker } from "./TimePicker";
import { setHours, setMinutes } from "date-fns";
import { DateTimeContainer } from "./DataTimeContainer";
import { getAvailabilityByAttributes } from "@/src/utils/reservation/checkAvailability";
import { StockAssignmentWidget } from "../widget/StockAssignmentWidget";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { UsePointsComponent } from "@/src/components/tenant/pos/ui/UsePointsComponent";
import { UseCouponComponent } from "@/src/components/tenant/pos/ui/UseCouponComponent";
import { Coupon } from "@/src/types/coupon/type.coupon";
import { usePromotionStore } from "@/src/store/usePromotionStore";
import { calculateBestPromotionForProduct } from "@/src/utils/promotion/promotio.engine";
import { formatCurrency } from "@/src/utils/currency-format";
import type { Product } from "@/src/types/product/type.product";
import type { ProductVariant } from "@/src/types/product/type.productVariant";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";
import { useReservationStore } from "@/src/store/useReservationStore";
import { useRentalStore } from "@/src/store/useRentalStore";
import { Client } from "@/src/types/clients/type.client";
import { StockLot } from "@/src/types/product/type.stockLote";
import { getTenantConfigAction } from "@/src/app/(tenant)/tenant/actions/settings.actions";
import { DEFAULT_TENANT_CONFIG } from "@/src/lib/tenant-defaults";
import { calculateTaxTotals } from "@/src/utils/pricing/tax-calculation";

interface DisplayAttributeValue {
  keyName: string;
  name: string;
  hex?: string;
  isColor: boolean;
}

interface DirectTransactionModalProps {
  item: Product;
  variantId: string;
  children: React.ReactNode;
  currentBranchId: string;
  type: "venta" | "alquiler";
  onSuccess?: () => void;
  selectedVariant?: ProductVariant;
  displayAttributes?: DisplayAttributeValue[];
}

export function DirectTransactionModal({
  item,
  variantId,
  children,
  currentBranchId,
  type,
  onSuccess,
  selectedVariant,
  displayAttributes = [],
}: DirectTransactionModalProps) {
  const [open, setOpen] = React.useState(false);
  const { data: session } = authClient.useSession();
  const sellerId = session?.user?.id || "";
  const [tenantConfig, setTenantConfig] = React.useState(DEFAULT_TENANT_CONFIG);

  // 1. Creamos referencias para "disparar" los clics
  const pickupDateRef = React.useRef<HTMLButtonElement>(null);
  const pickupTimeRef = React.useRef<HTMLButtonElement>(null);
  const returnDateRef = React.useRef<HTMLButtonElement>(null);
  const returnTimeRef = React.useRef<HTMLButtonElement>(null);

  // --------------------
  // Estados base
  // --------------------
  const [selectedCustomer, setSelectedCustomer] = React.useState<Client | null>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState("");

  const [usePoints, setUsePoints] = React.useState(false);
  const [appliedCoupon, setAppliedCoupon] = React.useState<Coupon | null>(null);

  const selectedClient = useCustomerStore((state) =>
    selectedCustomer?.id
      ? state.getCustomerById(selectedCustomer.id)
      : undefined,
  );
  const availablePoints = selectedClient?.loyaltyPoints || 0;
  const pointValueInMoney = tenantConfig.loyalty?.redemptionValue || 0.01;

  const [assignedStockIds, setAssignedStockIds] = React.useState<string[]>([]);

  const [checklist, setChecklist] = React.useState({
    deliverAfter: false,
    guaranteeAfter: false,
  });

  // Fechas
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: type === "alquiler" ? addDays(new Date(), 3) : new Date(),
  });

  const withTime = (date: Date, time: string) => {
    const [h, m] = time.split(":").map(Number);
    return setMinutes(setHours(date, h), m);
  };

  // --------------------
  // Estados financieros
  // --------------------
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>(
    [],
  );
  const [paymentMethodId, setPaymentMethodId] = React.useState("");

  const [receivedAmount, setReceivedAmount] = React.useState<string>("");

  const [guarantee, setGuarantee] = React.useState("");
  const [guaranteeType, setGuaranteeType] =
    React.useState<GuaranteeType>("dinero");

  const [pickupTime, setPickupTime] = React.useState(
    MOCK_BRANCH_CONFIG.openHours.open,
  );
  const [returnTime, setReturnTime] = React.useState(
    MOCK_BRANCH_CONFIG.openHours.close,
  );
  const setReservationData = useReservationStore((s) => s.setReservationData);
  const setRentalData = useRentalStore((s) => s.setRentalData);

  React.useEffect(() => {
    let cancelled = false;

    const loadPaymentMethods = async () => {
      const result = await getAvailablePaymentMethodsAction();
      if (cancelled) return;

      if (!result.success || !result.data) {
        toast.error(result.error || "No se pudieron cargar los métodos de pago");
        return;
      }

      setPaymentMethods(result.data);
      setPaymentMethodId((current) => current || result.data[0]?.id || "");
    };

    const loadTenantConfig = async () => {
      const res = await getTenantConfigAction();
      if (cancelled) return;
      if (res.success && res.data) {
        setTenantConfig(res.data as any);
      }
    };

    loadPaymentMethods();
    loadTenantConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------
  // Stock exacto
  // --------------------
  const { inventoryItems, stockLots, productVariants } = useInventoryStore();

  // 2️⃣ Paso 2: Filtramos localmente usando useMemo
  const validStockCandidates = useMemo(() => {
    const productId = String(item.id);

    if (item.is_serial) {
      return inventoryItems.filter(
        (s) =>
          String(s.productId) === productId &&
          s.variantId === variantId &&
          s.status === "disponible" &&
          (type === "venta" ? s.isForSale : s.isForRent),
      );
    } else {
      return stockLots.filter(
        (s) =>
          String(s.productId) === productId &&
          s.variantId === variantId &&
          s.status === "disponible" &&
          s.quantity > 0 &&
          (type === "venta" ? s.isForSale : s.isForRent),
      );
    }
  }, [inventoryItems, stockLots, item.id, item.is_serial, variantId, type]);

  const variant = useMemo(
    () =>
      selectedVariant ||
      productVariants.find((v: ProductVariant) => v.id === variantId),
    [selectedVariant, variantId, productVariants],
  );
  const colorName =
    displayAttributes.find(
      (attr) => attr.keyName.trim().toLowerCase() === "color",
    )?.name || variant?.attributes?.color;
  const sizeName =
    displayAttributes.find((attr) =>
      ["size", "talla"].includes(attr.keyName.trim().toLowerCase()),
    )?.name || variant?.attributes?.size;

  // 3. Seleccionamos el mejor candidato
  const selectedStockId = validStockCandidates[0]?.id;

  const stockCount = useMemo(
    () =>
      validStockCandidates.reduce(
        (acc, curr) => acc + ((curr as StockLot).quantity ?? 1),
        0,
      ),
    [validStockCandidates],
  );

  const hasStock = stockCount >= quantity;

  // Evaluacion de promociones automaticas
  const { promotions } = usePromotionStore();

  const activePromos = useMemo(() => {
    const now = new Date();
    return promotions.filter((promo) => {
      if (!promo.isActive) return false;
      if (promo.startDate && new Date(promo.startDate) > now) return false;
      if (promo.endDate && new Date(promo.endDate) < now) return false;
      if (promo.branchIds?.length && !promo.branchIds.includes(currentBranchId))
        return false;
      if (promo.usageType && promo.usageType !== "automatic") return false;
      if (!promo.appliesTo.includes(type)) return false;
      return true;
    });
  }, [promotions, currentBranchId, type]);

  const bestPromo = useMemo(() => {
    const defaultPrice =
      type === "venta" ? variant?.priceSell || 0 : variant?.priceRent || 0;
    return calculateBestPromotionForProduct(item, defaultPrice, activePromos);
  }, [activePromos, item, type, variant]);

  const originalPriceSell = variant?.priceSell || 0;
  const originalPriceRent = variant?.priceRent || 0;
  const unitFinalPrice = bestPromo
    ? bestPromo.finalPrice
    : type === "venta"
      ? originalPriceSell
      : originalPriceRent;
  const unitDiscountAmount = bestPromo ? bestPromo.discount : 0;
  const rentUnit = variant?.rentUnit;

  const { days, totalOperacion, isVenta, isEvent } = usePriceCalculation({
    operationType: type,
    priceSell: type === "venta" ? unitFinalPrice : originalPriceSell, // Passed the discounted price
    priceRent: type === "alquiler" ? unitFinalPrice : originalPriceRent,
    quantity,
    startDate: withTime(dateRange.from, pickupTime),
    endDate:
      type === "alquiler" ? withTime(dateRange.to, returnTime) : undefined,
    rentUnit: rentUnit as "día" | "evento" | undefined,
    receivedAmount: Number(receivedAmount),
    guaranteeAmount: guaranteeType === "dinero" ? Number(guarantee) : 0,
  });

  const pointsConsumed = usePoints
    ? Math.min(availablePoints, Math.ceil(totalOperacion / pointValueInMoney))
    : 0;
  const pointsDiscount = pointsConsumed * pointValueInMoney;

  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") {
      couponDiscount = Math.floor(
        totalOperacion * (appliedCoupon.discountValue / 100),
      );
    } else {
      couponDiscount = Math.min(totalOperacion, appliedCoupon.discountValue);
    }
  }

  const totalDescuentoExtra = pointsDiscount + couponDiscount;
  const totalOperacionConDescuento = Math.max(
    totalOperacion - totalDescuentoExtra,
    0,
  );

  const taxTotals = useMemo(
    () => calculateTaxTotals(totalOperacionConDescuento, tenantConfig.tax),
    [totalOperacionConDescuento, tenantConfig.tax],
  );

  const totalACobrarHoy = useMemo(() => {
    if (type === "venta") return taxTotals.total;

    return (
      taxTotals.total +
      (guaranteeType === "dinero" ? Number(guarantee || 0) : 0)
    );
  }, [type, taxTotals.total, guaranteeType, guarantee]);

  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((method) => method.id === paymentMethodId),
    [paymentMethodId, paymentMethods],
  );
  const isCashPayment = selectedPaymentMethod?.type === "cash";

  const changeAmount = useMemo(() => {
    if (!isCashPayment) return 0;
    if (Number(receivedAmount) <= 0) return 0;
    if (Number(receivedAmount) < totalACobrarHoy) return 0;
    return Number(receivedAmount) - totalACobrarHoy;
  }, [receivedAmount, totalACobrarHoy, isCashPayment]);

  const validateTransaction = () => {
    const check = getAvailabilityByAttributes(
      item.id,
      variantId,
      dateRange.from,
      dateRange.to || dateRange.from,
      type,
    );

    if (!check.available) {
      toast.error("No se puede realizar la operación", {
        description: check.reason,
      });
      return false;
    }

    return true;
  };

  const handleConfirm = async () => {
    if (!validateTransaction()) return;
    if (!selectedCustomer) return toast.error("Seleccione un cliente");
    if (!paymentMethodId) {
      return toast.error("Selecciona un método de pago válido");
    }
    if (!hasStock || !selectedStockId)
      return toast.error(
        `Solo hay ${stockCount} unidades disponibles para ${type}.`,
      );

    let transactionItems: (RentalDTO["items"][number] | SaleDTO["items"][number])[] = [];

    if (item.is_serial) {
      if (assignedStockIds.length !== quantity) {
        return toast.error(
          `Debes asignar las ${quantity} prendas específicas en la lista.`,
        );
      }

      transactionItems = assignedStockIds.map((id) => {
        return {
          productId: item.id,
          productName: item.name,
          stockId: item.is_serial ? undefined : id,
          inventoryItemId: item.is_serial ? id : undefined,
          quantity: 1,
          variantId,
          priceAtMoment: unitFinalPrice,
          listPrice: isVenta ? originalPriceSell : originalPriceRent,
          discountAmount: unitDiscountAmount,
          discountReason: bestPromo?.reason || "",
        };
      });
    } else {
      let remainingQty = quantity;
      for (const lot of validStockCandidates as StockLot[]) {
        if (remainingQty <= 0) break;
        const take = Math.min(remainingQty, lot.quantity);
        transactionItems.push({
          productId: item.id,
          productName: item.name,
          stockId: lot.id, // Usamos el ID (UUID)
          quantity: take,
          variantId,
          priceAtMoment: unitFinalPrice,
          listPrice: isVenta ? originalPriceSell : originalPriceRent,
          discountAmount: unitDiscountAmount,
          discountReason: bestPromo?.reason || "",
        });
        remainingQty -= take;
      }
    }

    const baseData = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.firstName + " " + selectedCustomer.lastName,
      sellerId,
      branchId: currentBranchId,
      notes,
      createdAt: new Date(),
    };

    if (type === "alquiler") {
      const rentalData: RentalDTO = {
        ...baseData,
        type: "alquiler",
        startDate: dateRange.from,
        endDate: dateRange.to,
        financials: {
          subtotal: Number(totalOperacion),
          totalDiscount: Number(
            totalDescuentoExtra +
              unitDiscountAmount *
                quantity *
                (type === "alquiler" && rentUnit !== "evento" ? days || 1 : 1),
          ),
          taxAmount: taxTotals.taxAmount,
          totalAmount: Number(taxTotals.total),
          receivedAmount:
            isCashPayment
              ? Number(receivedAmount)
              : Number(taxTotals.total) +
                (guaranteeType === "dinero" ? Number(guarantee) : 0),
          keepAsCredit: false,
          paymentMethod: paymentMethodId,
        },
        status: !checklist.deliverAfter ? "alquilado" : "reservado_fisico",
        id: "",
        operationId: "",
        items: transactionItems as RentalDTO["items"],
        updatedAt: new Date(),
      };

      try {
        const res = await processTransactionAction(rentalData as unknown as Record<string, unknown>);
        if(!res.success) throw new Error(res.error);
      const availability = await getAvailabilityCalendarDataAction();
      if (availability.success && availability.data) {
        setReservationData(
          availability.data.reservations,
          availability.data.reservationItems,
        );
        setRentalData(availability.data.rentals, availability.data.rentalItems);
      }
      if (rentalData.status === "alquilado") {
        toast.success("Alquiler realizado correctamente");
      } else {
        toast.success("Registro para entrega posterior exitoso");
      }
      setOpen(false);
      onSuccess?.();
      } catch (err: unknown) {
        toast.error((err as Error).message || "Error procesando alquiler");
      }
    }

    if (type === "venta") {
      const saleData: SaleDTO = {
        type: "venta",
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.firstName + " " + selectedCustomer.lastName,
        sellerId,
        branchId: currentBranchId,
        items: transactionItems as SaleDTO["items"],
        financials: {
          subtotal: Number(totalOperacion),
          totalDiscount: Number(
            totalDescuentoExtra + unitDiscountAmount * quantity,
          ),
          taxAmount: taxTotals.taxAmount,
          totalAmount: Number(taxTotals.total),
          receivedAmount:
            isCashPayment
              ? Number(receivedAmount)
              : Number(taxTotals.total),
          keepAsCredit: false,
          paymentMethod: paymentMethodId,
        },
        notes,
        status: !checklist.deliverAfter
          ? "vendido"
          : "vendido_pendiente_entrega",
        id: "",
        operationId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        const res = await processTransactionAction(saleData as unknown as Record<string, unknown>);
        if(!res.success) throw new Error(res.error);
      const availability = await getAvailabilityCalendarDataAction();
      if (availability.success && availability.data) {
        setReservationData(
          availability.data.reservations,
          availability.data.reservationItems,
        );
        setRentalData(availability.data.rentals, availability.data.rentalItems);
      }
      if (!checklist.deliverAfter) {
        toast.success("Venta realizada correctamente");
      } else {
        toast.success("Registro para entrega posterior exitoso");
      }
      setOpen(false);
      onSuccess?.();
      } catch (err: unknown) {
        toast.error((err as Error).message || "Error procesando venta");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="uppercase text-sm font-black">
            {type === "alquiler" ? (
              <span className="flex items-center gap-2 text-blue-500">
                <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
                Alquiler Inmediato
              </span>
            ) : (
              <span className="flex items-center gap-2 text-orange-500">
                <HugeiconsIcon icon={SaleTag02Icon} strokeWidth={2} />
                Venta Directa
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Completa el formulario para realizar la operación
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
          {/* Producto */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <div className="w-12 h-12 rounded border flex items-center justify-center font-bold text-xs uppercase text-primary">
              {sizeName || "S/T"}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold uppercase">{item.name}</h4>
              <p className="text-[10px] text-muted-foreground">
                Color: {colorName || "N/A"} | SKU: {item.baseSku}
              </p>
            </div>
            <div className="w-20">
              <Label className="text-[9px] uppercase font-black">Cant.</Label>
              <Input
                type="number"
                min={1}
                max={Number(stockCount)}
                value={quantity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > Number(stockCount)) {
                    setQuantity(Number(stockCount));
                    toast.error(`Máximo disponible: ${stockCount}`);
                  } else {
                    setQuantity(val);
                  }
                }}
                className="h-8 font-bold"
              />
            </div>
          </div>

          {/* Checkbox Entregar despues */}
          <div className="flex flex-col gap-2 p-2 bg-muted/10 rounded-lg">
            <FieldGroup>
              <Field orientation="horizontal">
                <Checkbox
                  disabled={checklist.guaranteeAfter}
                  id="deliver-check"
                  checked={checklist.deliverAfter}
                  onCheckedChange={(checked) =>
                    setChecklist({
                      ...checklist,
                      deliverAfter: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor="deliver-check"
                  className="text-[11px] font-medium"
                >
                  Entregar despues
                </Label>
              </Field>
            </FieldGroup>

            {type === "alquiler" && checklist.deliverAfter && (
              <FieldGroup>
                <Field orientation="horizontal">
                  <Checkbox
                    id="guarantee-check"
                    checked={checklist.guaranteeAfter}
                    onCheckedChange={(checked) =>
                      setChecklist({
                        ...checklist,
                        guaranteeAfter: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="guarantee-check"
                    className="text-[11px] font-medium"
                  >
                    Cobrar garantia al entregar
                  </Label>
                </Field>
              </FieldGroup>
            )}
          </div>

          {/* Bloque de Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <DateTimeContainer
                label={type === "venta" ? "Fecha de Recojo" : "Inicio Alquiler"}
                date={dateRange.from}
                time={pickupTime}
                onDateClick={() => pickupDateRef.current?.click()}
                onTimeClick={() => pickupTimeRef.current?.click()}
                placeholderDate="Seleccionar fecha"
                placeholderTime="Seleccionar hora"
              />
              <div className="absolute opacity-0 pointer-events-none top-0">
                <DirectTransactionCalendar
                  triggerRef={pickupDateRef}
                  selectedDate={dateRange.from}
                  onSelect={(date) =>
                    setDateRange({ ...dateRange, from: date as Date })
                  }
                  mode="pickup"
                  productId={item.id}
                  variantId={variantId}
                  quantity={quantity}
                  type={type}
                />
                <TimePicker
                  triggerRef={pickupTimeRef}
                  value={pickupTime}
                  onChange={setPickupTime}
                />
              </div>
            </div>

            {type === "alquiler" && (
              <div className="relative">
                <DateTimeContainer
                  label="Fecha de Devolución"
                  date={dateRange.to}
                  time={returnTime}
                  onDateClick={() => returnDateRef.current?.click()}
                  onTimeClick={() => returnTimeRef.current?.click()}
                  placeholderDate="Seleccionar fecha"
                  placeholderTime="Seleccionar hora"
                />
                <div className="absolute opacity-0 pointer-events-none top-0">
                  <DirectTransactionCalendar
                    triggerRef={returnDateRef}
                    minDate={dateRange.from}
                    selectedDate={dateRange.to}
                    onSelect={(date) =>
                      setDateRange({ ...dateRange, to: date as Date })
                    }
                    mode="return"
                    type={type}
                    productId={item.id}
                    variantId={variantId}
                    quantity={quantity}
                  />
                  <TimePicker
                    triggerRef={returnTimeRef}
                    value={returnTime}
                    onChange={setReturnTime}
                  />
                </div>
              </div>
            )}
          </div>

          {type === "alquiler" && (
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                <strong>Nota:</strong> Al ser transacción directa con pago
                total, la prenda se apartará físicamente. El recojo debe ser
                entre hoy y el {format(addDays(new Date(), 2), "dd/MM")}.
              </p>
            </div>
          )}

          <CustomerSelector
            selected={selectedCustomer}
            onSelect={setSelectedCustomer}
          />

          {selectedCustomer && (
            <div className="flex flex-col gap-2 mt-2">
              <UsePointsComponent
                usePoints={usePoints}
                setUsePoints={setUsePoints}
                availablePoints={availablePoints}
                pointValueInMoney={pointValueInMoney}
              />
              <UseCouponComponent
                tenantId={item.tenantId || ""}
                selectedClientId={selectedCustomer.id}
                appliedCoupon={appliedCoupon}
                onApplyCoupon={setAppliedCoupon}
              />
            </div>
          )}

          <div className="space-y-4">
            <PriceBreakdownBase
              unitPrice={unitFinalPrice}
              quantity={quantity}
              days={days}
              isEvent={isEvent}
              total={totalOperacion}
            />
            {totalDescuentoExtra > 0 && (
              <div className="flex justify-between items-center text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded">
                <span>Descuento Extra (Puntos/Cupón)</span>
                <span>- {formatCurrency(totalDescuentoExtra)}</span>
              </div>
            )}
              <div className="flex justify-between items-center text-base font-black">
                <span>Total Operación</span>
                <span>{formatCurrency(taxTotals.total)}</span>
              </div>
              {tenantConfig.tax?.rate > 0 && (
                <div className="text-xs text-muted-foreground">
                  {tenantConfig.tax.calculationMode === "TAX_INCLUDED"
                    ? "Incluye IGV"
                    : `IGV (${Math.round(tenantConfig.tax.rate * 100)}%): ${formatCurrency(taxTotals.taxAmount)}`}
                </div>
              )}
          </div>

          <CashPaymentSummary
            checklist={checklist}
            type={type}
            totalToPay={totalACobrarHoy}
            paymentMethodId={paymentMethodId}
            setPaymentMethodId={setPaymentMethodId}
            paymentMethods={paymentMethods}
            isCashPayment={isCashPayment}
            receivedAmount={receivedAmount}
            setReceivedAmount={setReceivedAmount}
            changeAmount={changeAmount}
            guarantee={guarantee}
            setGuarantee={setGuarantee}
            guaranteeType={guaranteeType}
            setGuaranteeType={setGuaranteeType}
          />

          {item.is_serial && (
            <div className="mt-4">
              <div className="border-t border-r border-l border-b-0  p-2  rounded-md">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <HugeiconsIcon icon={Warning} className="w-3 h-3" />
                  Producto serializado: Debes seleccionar qué unidades
                  específicas entregar.
                </p>
              </div>

              <StockAssignmentWidget
                productId={item.id}
                variantId={variantId}
                isImmediate={true}
                quantity={quantity}
                operationType={type}
                dateRange={dateRange}
                currentBranchId={currentBranchId}
                onAssignmentChange={setAssignedStockIds}
                isSerial={item.is_serial}
              />
            </div>
          )}
        </div>

        {!hasStock ? (
          <Button disabled className="bg-red-600">
            STOCK NO DISPONIBLE
          </Button>
        ) : (
          <Button
            onClick={() => handleConfirm()}
            className={`flex-1 h-12 font-black ${
              type === "alquiler"
                ? "text-white bg-linear-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 rounded-base text-sm px-4 py-2.5 text-center leading-5"
                : "text-white bg-linear-to-r from-orange-500 via-orange-600 to-orange-700 hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-orange-300 dark:focus:ring-orange-800 rounded-base text-sm px-4 py-2.5 text-center leading-5"
            }`}
          >
            {checklist.deliverAfter
              ? "GUARDAR Y ENTREGAR DESPUES"
              : "ENTREGAR AHORA"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
