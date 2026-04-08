"use client";

import React, { useMemo, useState, useEffect } from "react";
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
import { ShoppingBag, AlertTriangle, Banknote, Calendar, Tag, AlertCircle } from "lucide-react";

// --- IMPORTS ---
import { useCartStore } from "@/src/store/useCartStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { CustomerSelector } from "@/src/components/tenant/home/ui/reservation/CustomerSelector";
import { CashPaymentSummary } from "@/src/components/tenant/home/ui/direct-transaction/CashPaymentSummary";
import {
  processTransactionAction,
  reserveBundlesAction,
} from "@/src/app/(tenant)/tenant/actions/transaction.actions";
import { getAvailablePaymentMethodsAction } from "@/src/app/(tenant)/tenant/actions/payment-method.actions";
import {
  getBranchInventoryAction,
} from "@/src/app/(tenant)/tenant/actions/inventory.actions";
import { redeemPointsAction } from "@/src/app/(tenant)/tenant/actions/loyalty.actions";
import { getTenantConfigAction } from "@/src/app/(tenant)/tenant/actions/settings.actions";
import { DEFAULT_TENANT_CONFIG } from "@/src/lib/tenant-defaults";
import { formatCurrency } from "@/src/utils/currency-format";
import { calculateTaxTotals } from "@/src/utils/pricing/tax-calculation";
import { SaleDTO } from "@/src/application/dtos/SaleDTO";
import { RentalDTO } from "@/src/application/dtos/RentalDTO";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";
import { DateTimeContainer } from "@/src/components/tenant/home/ui/direct-transaction/DataTimeContainer";
import { DirectTransactionCalendar } from "@/src/components/tenant/home/ui/direct-transaction/DirectTransactionCalendar";
import { TimePicker } from "@/src/components/tenant/home/ui/direct-transaction/TimePicker";
import { getAvailabilityByAttributes } from "@/src/utils/reservation/checkAvailability";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge03Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/badge";
import { PaymentMethodType } from "@/src/utils/status-type/PaymentMethodType";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { UsePointsComponent } from "../ui/UsePointsComponent";
import { CartItem } from "@/src/types/cart/type.cart";
import { UseCouponComponent } from "../ui/UseCouponComponent";
import { Coupon } from "@/src/types/coupon/type.coupon";
import { useCouponStore } from "@/src/store/useCouponStore";
import { authClient } from "@/src/lib/auth-client";
import { useBranchStore } from "@/src/store/useBranchStore";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";
import { useRequireCashSession } from "@/src/hooks/useRequireCashSession";

import { PinAuthModal } from "./PinAuthModal";

interface PosCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomer?: any | null;
  onSelectedCustomerChange?: (client: any) => void;
  usePoints?: boolean;
  onUsePointsChange?: (value: boolean) => void;
  appliedCoupon?: Coupon | null;
  onAppliedCouponChange?: (coupon: Coupon | null) => void;
  showCustomerSelector?: boolean;
  showDiscountControls?: boolean;
}

export function PosCheckoutModal({
  open,
  onOpenChange,
  selectedCustomer: selectedCustomerProp,
  onSelectedCustomerChange,
  usePoints: usePointsProp,
  onUsePointsChange,
  appliedCoupon: appliedCouponProp,
  onAppliedCouponChange,
  showCustomerSelector = true,
  showDiscountControls = true,
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

  const { data: session } = authClient.useSession();
  const sellerId = session?.user?.id || "";
  const currentBranchId = useBranchStore((s) => s.selectedBranchId) || "";
  const { productVariants } = useInventoryStore();
  const [tenantConfig, setTenantConfig] = useState(DEFAULT_TENANT_CONFIG);

  useEffect(() => {
    let cancelled = false;

    const loadTenantConfig = async () => {
      const res = await getTenantConfigAction();
      if (cancelled) return;
      if (res.success && res.data) {
        setTenantConfig(res.data as any);
      }
    };

    if (open) {
      loadTenantConfig();
    }

    return () => {
      cancelled = true;
    };
  }, [open]);

  // ─── ESTADOS ───
  const [localSelectedCustomer, setLocalSelectedCustomer] = useState<any>(null);
  const selectedCustomer = selectedCustomerProp ?? localSelectedCustomer;
  const setSelectedCustomer =
    onSelectedCustomerChange ?? setLocalSelectedCustomer;
  const [notes, setNotes] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");

  useEffect(() => {
    async function loadPaymentMethods() {
      const res = await getAvailablePaymentMethodsAction();
      if (res.success && res.data) {
        setPaymentMethods(res.data);
        if (res.data.length > 0) {
          setPaymentMethodId(res.data[0].id);
        }
      }
    }
    if (open) {
      loadPaymentMethods();
    }
  }, [open]);

  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((m) => m.id === paymentMethodId),
    [paymentMethods, paymentMethodId],
  );

  const isCashPayment = selectedPaymentMethod?.type === "cash";

  const [localUsePoints, setLocalUsePoints] = React.useState(false);
  const [localAppliedCoupon, setLocalAppliedCoupon] = useState<Coupon | null>(null);
  
  const allowStacking = tenantConfig.pricing?.allowDiscountStacking ?? true;
  const hasItemLevelDiscounts = items.some(i => (i.discountAmount || 0) > 0);
  const prohibitStacking = !allowStacking && hasItemLevelDiscounts;

  const usePoints = prohibitStacking ? false : (usePointsProp ?? localUsePoints);
  const setUsePoints = onUsePointsChange ?? setLocalUsePoints;
  const appliedCoupon = prohibitStacking ? null : (appliedCouponProp ?? localAppliedCoupon);
  const setAppliedCoupon = onAppliedCouponChange ?? setLocalAppliedCoupon;

  // Obtenemos al cliente actual desde tu store
  const selectedClient = useCustomerStore((state) =>
    selectedCustomer?.id
      ? state.getCustomerById(selectedCustomer.id)
      : undefined,
  );

  // Configuraciones (Idealmente vienen de tus businessRules)
  const availablePoints = selectedClient?.loyaltyPoints || 0;
  const pointValueInMoney = tenantConfig.loyalty?.redemptionValue || 0.01;

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

  // Horarios por defecto (Idealmente vendrían del config de sucursal)
  const pickupTime = globalRentalTimes?.pickup || "08:00";
  const returnTime = globalRentalTimes?.return || "20:00";

  // Financieros
  const [receivedAmount, setReceivedAmount] = useState("");
  const [guarantee, setGuarantee] = useState("");
  const [guaranteeType, setGuaranteeType] = useState<GuaranteeType>("dinero");
  
  // Trackea el último total sugerido para saber si el usuario lo modificó
  const lastSuggestedTotal = React.useRef<string>("");

  const [isProcessing, setIsProcessing] = useState(false);

  // --- ESTADOS DE AUTORIZACIÓN PIN ---
  const [showPinModal, setShowPinModal] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authorizedByName, setAuthorizedByName] = useState("");

  const requiresAuth = useMemo(() => {
    return items.some((item) => {
      if (item.requiresAdminAuth) return true;

      const listPrice = item.listPrice ?? item.unitPrice;
      const discountAmount = item.discountAmount ?? 0;
      if (listPrice <= 0 || discountAmount <= 0) return false;

      const discountPercent =
        Math.round(((discountAmount / listPrice) * 100) * 100) / 100;
      return (
        tenantConfig.pricing?.requirePinForHighDiscount &&
        discountPercent >= (tenantConfig.pricing?.highDiscountThreshold ?? 0)
      );
    });
  }, [items, tenantConfig]);

  // ─── CLASIFICACIÓN DE ITEMS ───
  const ventaItems = useMemo(
    () => items.filter((i) => i.operationType === "venta"),
    [items],
  );
  const alquilerItems = useMemo(
    () => items.filter((i) => i.operationType === "alquiler"),
    [items],
  );

  const hasSales = ventaItems.length > 0;
  const hasRentals = alquilerItems.length > 0;
  const getMultiplier = (item: CartItem) => {
    const variant = productVariants.find((v) => v.id === item.variantId);
    return item.operationType === "alquiler" && variant?.rentUnit !== "evento"
      ? Math.max(differenceInDays(dateRange.to, dateRange.from), 1)
      : 1;
  };

  // ─── CÁLCULOS DE PRECIO ───
  const totalVentas = useMemo(
    () => ventaItems.reduce((acc, item) => acc + item.subtotal, 0),
    [ventaItems],
  );

  const totalAlquileres = useMemo(
    () => alquilerItems.reduce((acc, item) => acc + item.subtotal, 0),
    [alquilerItems],
  );

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
  const baseAmount = Math.max(
    subtotalConPromos - pointsDiscount - couponDiscount,
    0,
  );

  const itemAmounts = useMemo(() => items.map(item => ({
    amount: (item.listPrice ?? item.unitPrice) * item.quantity * getMultiplier(item)
  })), [items, getMultiplier]);

  const taxTotals = calculateTaxTotals(
    baseAmount, 
    tenantConfig.tax, 
    selectedPaymentMethod?.type as "cash" | "digital" | "card" | "transfer" | undefined,
    itemAmounts
  );
  const totalBrutoConIGV = taxTotals.total;
  const subtotalSinIGV = taxTotals.subtotal;
  const taxAmount = taxTotals.taxAmount;

  // Total final (ya incluye IGV)

  const totalACobrarHoy = useMemo(() => {
    const guaranteeValue =
      guaranteeType === "dinero" ? Number(guarantee || 0) : 0;

    return totalBrutoConIGV + (hasRentals ? guaranteeValue : 0);
  }, [totalBrutoConIGV, guarantee, guaranteeType, hasRentals]);

  const changeAmount = useMemo(() => {
    if (!isCashPayment) return 0;
    const received = Number(receivedAmount);
    if (received <= 0 || received < totalACobrarHoy) return 0;
    return received - totalACobrarHoy;
  }, [receivedAmount, totalACobrarHoy, isCashPayment]);

  // EFECTO: Autocompletar monto recibido con el total exacto de forma inteligente
  useEffect(() => {
    const currentTotalStr = totalACobrarHoy.toFixed(2);
    const isEffectivelyEmpty = !receivedAmount || receivedAmount === "" || receivedAmount === "0" || receivedAmount === "0.00";
    
    // CASO 1: El modal se abre por primera vez o el monto está vacío/en cero
    if (open && isEffectivelyEmpty) {
      setReceivedAmount(currentTotalStr);
      lastSuggestedTotal.current = currentTotalStr;
      return;
    }

    // CASO 2: El total cambió (ej. cargó el config del tenant) y el usuario aún tiene el monto sugerido anterior
    if (open && receivedAmount === lastSuggestedTotal.current && currentTotalStr !== lastSuggestedTotal.current) {
      setReceivedAmount(currentTotalStr);
      lastSuggestedTotal.current = currentTotalStr;
    }
  }, [open, totalACobrarHoy, receivedAmount]);

  const withTime = (date: Date, time: string) => {
    const [h, m] = time.split(":").map(Number);
    return setMinutes(setHours(date, h), m);
  };

  const { canProceed: canProceedCash } = useRequireCashSession();

  // ─── VALIDACIONES ───
  const conflicts = useMemo(() => {
    if (!hasRentals) return [];
    const list: string[] = [];

    alquilerItems.forEach((item) => {
      const check = getAvailabilityByAttributes(
        item.product.id,
        item.variantId || "",
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
    if (!canProceedCash) {
       return toast.error("Caja no abierta", {
         description: "Debes abrir la caja antes de procesar cobros (Configuración obligatoria)."
       });
    }
    const isGeneral = !selectedCustomer;
    if (isGeneral && hasRentals) {
      return toast.error("Seleccione un cliente", {
        description: "Los alquileres requieren un cliente registrado por seguridad y seguimiento."
      });
    }
    if (conflicts.length > 0)
      return toast.error("Conflictos de stock en fechas seleccionadas");
    if (missingSerials) return toast.error("Faltan asignar series");
    if (!selectedPaymentMethod) return toast.error("Seleccione un método de pago");

    // Validar Autorización de PIN si es necesario
    if (requiresAuth && !isAuthorized) {
      setShowPinModal(true);
      return;
    }

    const baseData = {
      tenantId: activeTenantId ?? items[0]?.product?.tenantId,
      customerId: selectedCustomer?.id || "",
      customerName: selectedCustomer 
        ? `${selectedCustomer.firstName ?? ""} ${selectedCustomer.lastName ?? ""}`.trim()
        : "Cliente General",
      sellerId,
      branchId: currentBranchId,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setIsProcessing(true);
    try {
      if (items.some((item) => item.bundleId)) {
        const tenantId = activeTenantId ?? items[0]?.product?.tenantId;
        if (!tenantId) throw new Error("Tenant no resuelto para bundle");
        const resBundle = await reserveBundlesAction(
          items,
          tenantId,
          currentBranchId,
          dateRange.from,
          dateRange.to,
        );
        if (!resBundle.success) throw new Error(resBundle.error);
      }

      const { stockLots } = useInventoryStore.getState();

      const prepareItems = (
        cartItems: CartItem[],
        opType: "venta" | "alquiler",
      ) => {
        const results: any[] = [];

        cartItems.forEach((cartItem) => {
          const unitPrice = cartItem.unitPrice;
          const discountAmount = cartItem.discountAmount ?? 0;
          // Si listPrice falta o es igual a unitPrice pero hay descuento, lo reconstruimos
          let listPrice = cartItem.listPrice ?? unitPrice;
          if (discountAmount > 0 && listPrice <= unitPrice) {
            listPrice = unitPrice + discountAmount;
          }
          
          const discountReason = cartItem.discountReason;
          const promotionId = cartItem.appliedPromotionId;
          const bundleId = cartItem.bundleId;

          if (cartItem.product.is_serial) {
            cartItem.selectedCodes.forEach((code: string) => {
              results.push({
                productId: cartItem.product.id,
                productName: cartItem.product.name,
                stockId: code,
                inventoryItemId: code,
                quantity: 1,
                variantId: cartItem.variantId ?? "",
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
              l.variantId === (cartItem.variantId || "") &&
              l.branchId === currentBranchId &&
              (opType === "venta" ? l.isForSale : l.isForRent),
          );

          for (const lot of candidates) {
            if (remaining <= 0) break;

            const take = Math.min(remaining, lot.quantity);
            if (take <= 0) continue; // SEGURIDAD: No añadir items con cantidad 0 si el lote está vacío

            results.push({
              productId: cartItem.product.id,
              productName: cartItem.product.name,
              stockId: lot.id,
              quantity: take,
              variantId: cartItem.variantId ?? "",
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

      const saleShare =
        hasSales && hasRentals && subtotalConPromos > 0
          ? totalVentas / subtotalConPromos
          : hasSales
            ? 1
            : 0;
      const rentalShare =
        hasSales && hasRentals && subtotalConPromos > 0
          ? totalAlquileres / subtotalConPromos
          : hasRentals
            ? 1
            : 0;

      const saleTotalAmount =
        Math.round(totalBrutoConIGV * saleShare * 100) / 100;
      const guaranteeAmount =
        guaranteeType === "dinero" ? Number(guarantee || 0) : 0;
      const rentalTotalAmount =
        Math.round(totalBrutoConIGV * rentalShare * 100) / 100 +
        guaranteeAmount;

      // Función para limpiar y parsear el monto ingresado (maneja comas y símbolos)
      const parseReceivedAmount = (val: string) => {
        if (!val || val.trim() === "") return 0;
        // Eliminar todo lo que no sea número, coma o punto
        const cleaned = val.replace(/[^0-9.,]/g, "").replace(",", ".");
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      let amountToProcess = parseReceivedAmount(receivedAmount);
      
      // FALLBACK DE SEGURIDAD: Si el monto es 0 pero el total es positivo y NO es una venta a crédito,
      // asumimos que el usuario quiere cobrar el total (especialmente si es digital/tarjeta)
      if (amountToProcess <= 0 && totalACobrarHoy > 0 && !isCashPayment) {
        amountToProcess = totalACobrarHoy;
      }

      let remainingCash = isCashPayment ? amountToProcess : totalACobrarHoy;

      const saleReceived =
        isCashPayment
          ? Math.min(saleTotalAmount, remainingCash)
          : saleTotalAmount;

      if (isCashPayment)
        remainingCash = Math.max(0, remainingCash - saleReceived);

      const rentalReceived =
        isCashPayment ? remainingCash : rentalTotalAmount;

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
            subtotal: Math.round(subtotalBruto * saleShare * 100) / 100,
            totalDiscount: Math.round(totalDiscount * saleShare * 100) / 100,
            itemDiscountTotal: Math.round(discountFromItems * saleShare * 100) / 100,
            extraDiscountTotal: Math.round((pointsDiscount + couponDiscount) * saleShare * 100) / 100,
            taxAmount: Math.round(taxAmount * saleShare * 100) / 100,
            totalAmount: saleTotalAmount,
            totalBeforeRounding: Math.round(taxTotals.totalBeforeRounding * saleShare * 100) / 100,
            roundingDifference: Math.round(taxTotals.roundingDifference * saleShare * 100) / 100,
            keepAsCredit: false,
            receivedAmount: saleReceived,
            paymentMethodId: selectedPaymentMethod.id,
            pointsDiscount: Math.round(pointsDiscount * saleShare * 100) / 100,
            couponDiscount: Math.round(couponDiscount * saleShare * 100) / 100,
            couponCode: appliedCoupon?.code,
          },
        };

        const res = await processTransactionAction(saleDTO);
        if (!res.success) throw new Error(res.error);
      }

      if (alquilerItems.length > 0) {
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
            subtotal: Math.round(subtotalBruto * rentalShare * 100) / 100,
            totalDiscount: Math.round(totalDiscount * rentalShare * 100) / 100,
            itemDiscountTotal: Math.round(discountFromItems * rentalShare * 100) / 100,
            extraDiscountTotal: Math.round((pointsDiscount + couponDiscount) * rentalShare * 100) / 100,
            taxAmount: Math.round(taxAmount * rentalShare * 100) / 100,
            totalAmount: rentalTotalAmount,
            totalBeforeRounding: Math.round(taxTotals.totalBeforeRounding * rentalShare * 100) / 100,
            roundingDifference: Math.round(taxTotals.roundingDifference * rentalShare * 100) / 100,
            keepAsCredit: false,
            receivedAmount: rentalReceived,
            paymentMethodId: selectedPaymentMethod.id,
            pointsDiscount: Math.round(pointsDiscount * rentalShare * 100) / 100,
            couponDiscount: Math.round(couponDiscount * rentalShare * 100) / 100,
            couponCode: appliedCoupon?.code,
          },

          guarantee: {
            type: guaranteeType,
            value: guaranteeType === "dinero" ? guarantee : undefined,
            description: guaranteeType !== "dinero" ? guarantee : undefined,
            amount: guaranteeAmount,
          },
        };

        const res = await processTransactionAction(rentalDTO);
        if (!res.success) throw new Error(res.error);
      }

      if (usePoints && pointsConsumed > 0 && selectedCustomer) {
        await redeemPointsAction(
          selectedCustomer.id,
          pointsConsumed,
          "Canje de puntos en POS",
        );
      }

      if (appliedCoupon) {
        useCouponStore.getState().markAsUsed(appliedCoupon.id);
      }

      toast.success("Operación exitosa");
      clearCart();

      // RE-FETCH INVENTORY TO SYNC UI
      (async () => {
        const invRes = await getBranchInventoryAction(currentBranchId);
        if (invRes.success && invRes.data) {
          const store = useInventoryStore.getState();
          store.setProducts(invRes.data.products);
          store.setProductVariants(invRes.data.variants);
          store.setInventoryItems(invRes.data.inventoryItems);
          store.setStockLots(invRes.data.stockLots);
        }
      })();

      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Error al procesar");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
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
                    const variant = productVariants.find(
                      (v) => v.id === item.variantId,
                    );
                    const isEvent = variant?.rentUnit === "evento";

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
                        variantId=""
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

            {showCustomerSelector && (
              <CustomerSelector
                selected={selectedCustomer}
                onSelect={setSelectedCustomer}
              />
            )}

            <div className="bg-primary/5 p-3 rounded-lg border-l-2 border-primary">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase">
                  Total Operación
                </span>
                <span className="text-xl font-black text-primary">
                  {formatCurrency(totalBrutoConIGV)}
                </span>
              </div>
              {tenantConfig.tax?.rate > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {tenantConfig.tax.calculationMode === "TAX_INCLUDED"
                    ? "Incluye IGV"
                    : `IGV (${Math.round(tenantConfig.tax.rate * 100)}%): ${formatCurrency(taxAmount)}`}
                </div>
              )}
            </div>

            {/* SECCIÓN FIDELIDAD / CUPONES */}
            {showDiscountControls && selectedCustomer && (
              <div className="pt-2 border-t flex flex-col gap-2 relative">
                <div className={prohibitStacking ? "opacity-50 pointer-events-none" : ""}>
                  {selectedClient && availablePoints > 0 && (
                    <UsePointsComponent
                      usePoints={usePoints}
                      setUsePoints={setUsePoints}
                      availablePoints={availablePoints}
                      pointValueInMoney={pointValueInMoney}
                    />
                  )}
                  <UseCouponComponent
                    tenantId={activeTenantId ?? items[0]?.product?.tenantId ?? null}
                    selectedClientId={selectedCustomer?.id}
                    appliedCoupon={appliedCoupon}
                    onApplyCoupon={setAppliedCoupon}
                  />
                </div>
                {prohibitStacking && (
                  <div className="px-3 py-1.5 rounded-md border border-amber-500/20 bg-amber-500/5 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] text-amber-200/70 leading-tight">
                      No se pueden usar cupones/puntos porque el carrito ya tiene descuentos aplicados y la acumulación está desactivada.
                    </span>
                  </div>
                )}
              </div>
            )}

            <CashPaymentSummary
              type={hasRentals ? "alquiler" : "venta"}
              totalToPay={totalACobrarHoy}
              paymentMethodId={paymentMethodId}
              paymentMethods={paymentMethods}
              isCashPayment={isCashPayment}
              receivedAmount={receivedAmount}
              setReceivedAmount={setReceivedAmount}
              changeAmount={changeAmount}
              setPaymentMethodId={setPaymentMethodId}
              guarantee={guarantee}
              setGuarantee={setGuarantee}
              guaranteeType={guaranteeType}
              setGuaranteeType={setGuaranteeType}
            />
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleConfirm}
              disabled={
                isProcessing ||
                items.some(
                  (i) =>
                    i.product.is_serial && i.selectedCodes.length < i.quantity,
                ) ||
                (isCashPayment && Number(receivedAmount) < totalACobrarHoy && !hasRentals) ||
                (hasRentals && Number(receivedAmount) < totalACobrarHoy) ||
                (hasRentals && guarantee.length === 0) ||
                !selectedCustomer
              }
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

      <PinAuthModal
        open={showPinModal}
        onOpenChange={setShowPinModal}
        onSuccess={(name) => {
          setIsAuthorized(true);
          setAuthorizedByName(name);
          toast.info(`Operación autorizada por ${name}. Puedes confirmar el pago.`);
        }}
        title="Descuento Alto Detectado"
        description="Esta venta contiene productos con descuentos superiores al límite permitido (20%). Se requiere la autorización de un administrador."
      />
    </>
  );
}
