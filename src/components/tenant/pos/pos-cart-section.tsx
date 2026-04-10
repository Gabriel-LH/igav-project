"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ListChecks, AlertCircle } from "lucide-react";
import { useCartStore } from "@/src/store/useCartStore";
import { formatCurrency } from "@/src/utils/currency-format";
import { PosCartItem } from "./pos-cart-item";
import { PosCheckoutModal } from "./modals/PosCheckoutModal";
import { PosReservationModal } from "./modals/PosReservationModal";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingCart02Icon } from "@hugeicons/core-free-icons";
import { addDays, differenceInDays } from "date-fns";
import { DateTimeContainer } from "../home/ui/direct-transaction/DataTimeContainer";
import { DirectTransactionCalendar } from "../home/ui/direct-transaction/DirectTransactionCalendar";
import { TimePicker } from "../home/ui/direct-transaction/TimePicker";
import { PosBundlesPanel } from "./ui/PosBundlePanel";
import { FeatureGuard } from "@/src/components/tenant/guards/FeatureGuard";
import { toast } from "sonner";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { CustomerSelector } from "../home/ui/reservation/CustomerSelector";
import { UsePointsComponent } from "../pos/ui/UsePointsComponent";
import { UseCouponComponent } from "../pos/ui/UseCouponComponent";
import { Coupon } from "@/src/types/coupon/type.coupon";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { getTenantConfigAction } from "@/src/app/(tenant)/tenant/actions/settings.actions";
import { DEFAULT_TENANT_CONFIG } from "@/src/lib/tenant-defaults";
import { calculateTaxTotals } from "@/src/utils/pricing/tax-calculation";

export function PosCartSection() {
  const { productVariants } = useInventoryStore();
  const {
    items,
    getTotal,
    clearCart,
    globalRentalDates,
    setGlobalDates,
    globalRentalTimes,
    setGlobalTimes,
    clearBundleAssignments,
  } = useCartStore();

  const total = getTotal();

  // ─── MODALES ───
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [reservationOpen, setReservationOpen] = React.useState(false);

  const [tenantConfig, setTenantConfig] = React.useState(DEFAULT_TENANT_CONFIG);
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [usePoints, setUsePoints] = React.useState(false);
  const [appliedCoupon, setAppliedCoupon] = React.useState<Coupon | null>(null);

  const selectedClient = useCustomerStore((state) =>
    selectedCustomer?.id
      ? state.getCustomerById(selectedCustomer.id)
      : undefined,
  );
  const availablePoints = selectedClient?.loyaltyPoints || 0;
  const pointValueInMoney = tenantConfig.loyalty?.redemptionValue || 0.01;

  const returnDateRef = React.useRef<HTMLButtonElement>(null);
  const returnTimeRef = React.useRef<HTMLButtonElement>(null);

  const [pickupTime, setPickupTime] = React.useState("09:00");
  const [returnTime, setReturnTime] = React.useState("20:00");

  const alquilerItems = items.filter((i) => i.operationType === "alquiler");
  const hasRentals = alquilerItems.length > 0;

  const currentTime = React.useMemo(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }, []);

  React.useEffect(() => {
    const cancelled = false;

    const loadTenantConfig = async () => {
      const res = await getTenantConfigAction();
      if (cancelled) return;
      if (res.success && res.data) {
        setTenantConfig(res.data as any);
      }
    };

    loadTenantConfig();

    if (!globalRentalDates?.from) {
      const today = new Date();
      setGlobalDates({
        from: today,
        to: addDays(today, 3),
      });

      setGlobalTimes({
        pickup: currentTime,
        return: "20:00",
      });
    }
  }, [globalRentalDates, currentTime, setGlobalDates, setGlobalTimes]);

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
  const getMultiplier = (
    operationType: "venta" | "alquiler",
    rentUnit?: string,
  ) => {
    if (operationType !== "alquiler") return 1;
    if (rentUnit === "evento") return 1;
    return Math.max(days, 1);
  };

  const hasAppliedBundles = items.some((i) => i.bundleId);
  const subtotalConPromos = items.reduce((acc, curr) => acc + curr.subtotal, 0);

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

  const totalDescuentoExtra = pointsDiscount + couponDiscount;
  const totalOperacionConDescuento = Math.max(
    subtotalConPromos - totalDescuentoExtra,
    0,
  );
  const taxTotals = calculateTaxTotals(
    totalOperacionConDescuento,
    tenantConfig.tax,
  );

  const allowStacking = tenantConfig.pricing?.allowDiscountStacking ?? true;
  const hasItemLevelDiscounts = items.some((i) => (i.discountAmount || 0) > 0);
  const prohibitStacking = !allowStacking && hasItemLevelDiscounts;

  // Si no se permite acumular, y ya hay descuentos en items, reseteamos cupon/puntos si estuvieran
  React.useEffect(() => {
    if (prohibitStacking) {
      if (usePoints) setUsePoints(false);
      if (appliedCoupon) setAppliedCoupon(null);
    }
  }, [prohibitStacking, usePoints, appliedCoupon]);

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* 1. HEADER CLIENTE */}
      <div className="px-2 py-1 border-b  flex justify-between items-center">
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
        <div className="px-2 py-1  border-b space-y-2">
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
                label={`Fin (${days} ${days === 1 ? "día" : "días"})`}
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
      <div className="px-1 bg-background border-t shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] z-10">
        {items.length > 0 && (
          <div className="px-2 pb-3 space-y-2">
            <CustomerSelector
              selected={selectedCustomer}
              onSelect={setSelectedCustomer}
            />
            {selectedCustomer && availablePoints > 0 && (
              <div
                className={
                  prohibitStacking ? "opacity-50 pointer-events-none" : ""
                }
              >
                <UsePointsComponent
                  usePoints={usePoints}
                  setUsePoints={setUsePoints}
                  availablePoints={availablePoints}
                  pointValueInMoney={pointValueInMoney}
                />
              </div>
            )}
            <div
              className={
                prohibitStacking ? "opacity-50 pointer-events-none" : ""
              }
            >
              <UseCouponComponent
                tenantId={items[0]?.product?.tenantId ?? null}
                selectedClientId={selectedCustomer?.id}
                appliedCoupon={appliedCoupon}
                onApplyCoupon={setAppliedCoupon}
              />
            </div>
            {prohibitStacking && (
              <div className="px-2 py-1.5 rounded border border-amber-500/20 bg-amber-500/5 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] text-amber-200/70 leading-tight">
                  No se pueden usar cupones/puntos porque ya hay productos con
                  descuento aplicado.
                </span>
              </div>
            )}
          </div>
        )}

        {items.length > 0 && (
          <div className="pb-2">
            <div className="flex w-full justify-center items-center">
              {hasAppliedBundles ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-fit px-20"
                  onClick={() => {
                    clearBundleAssignments();
                    toast.info("Pack removido. Carrito recalculado.");
                  }}
                >
                  Quitar pack
                </Button>
              ) : (
                <div className="flex flex-wrap w-full gap-1">
                  {!hasAppliedBundles && <PosBundlesPanel />}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1 mb-4">
          {hasAppliedBundles && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>
                {formatCurrency(
                  items.reduce(
                    (acc, curr) =>
                      acc +
                      (curr.listPrice || curr.unitPrice) *
                        curr.quantity *
                        getMultiplier(
                          curr.operationType,
                          productVariants.find(
                            (v: any) => v.id === curr.variantId,
                          )?.rentUnit || (curr.product as any).rent_unit,
                        ),
                    0,
                  ),
                )}
              </span>
            </div>
          )}
          {items.some((i) => (i.discountAmount || 0) > 0) && (
            <div className="flex px-2 justify-between text-sm text-emerald-600 font-bold">
              <span>Descuentos</span>
              <span>
                -
                {formatCurrency(
                  items.reduce(
                    (acc, curr) =>
                      acc +
                      (curr.discountAmount || 0) *
                        curr.quantity *
                        getMultiplier(
                          curr.operationType,
                          productVariants.find(
                            (v: any) => v.id === curr.variantId,
                          )?.rentUnit || (curr.product as any).rent_unit,
                        ),
                    0,
                  ),
                )}
              </span>
            </div>
          )}
          {totalDescuentoExtra > 0 && (
            <div className="flex px-2 justify-between text-xs text-emerald-400">
              <span>Descuento (Puntos/Cupón)</span>
              <span>-{formatCurrency(totalDescuentoExtra)}</span>
            </div>
          )}
          <div className="flex px-2 -mb-2 justify-between items-end">
            <span>
              <span className="text-lg flex flex-col font-semibold">
                Total a Pagar
              </span>
              {tenantConfig.tax?.rate > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {tenantConfig.tax.calculationMode === "TAX_INCLUDED"
                      ? "Incluye IGV"
                      : `IGV (${Math.round(tenantConfig.tax.rate * 100)}%)`}
                  </span>
                  <span>
                    {tenantConfig.tax.calculationMode === "TAX_INCLUDED"
                      ? formatCurrency(taxTotals.taxAmount)
                      : formatCurrency(taxTotals.taxAmount)}
                  </span>
                </div>
              )}
            </span>
            <span className="text-2xl font-semibold text-green-600 tracking-tight">
              {formatCurrency(taxTotals.total)}
            </span>
          </div>
        </div>

        {/* --- BOTONES DE ACCIÓN --- */}
        <div className="grid px-2 grid-cols-2 gap-2 h-10">
          <FeatureGuard feature={["reservations", "sales", "rentals"]}>
            <Button
              className="col-span-1 h-8 bg-orange-500 text-white hover:bg-orange-600 flex flex-col gap-0.5"
              onClick={() => setReservationOpen(true)}
              disabled={items.length === 0}
            >
              <span className="text-[10px] font-bold uppercase">Reservar</span>
              <span className="text-[9px] opacity-80">(Adelanto)</span>
            </Button>
          </FeatureGuard>

          {hasRentals ? (
            <FeatureGuard feature="rentals">
              <Button
                className="col-span-1 h-8 text-sm text-white  shadow-lg flex flex-col gap-0.1 bg-blue-600 hover:bg-blue-700"
                onClick={() => setCheckoutOpen(true)}
                disabled={items.length === 0 || text.length > 0}
              >
                {text.length > 0 ? text : "COBRAR"}
                {hasRentals && (
                  <span className="text-[9px] opacity-80">
                    La garantía se cobra en caja.
                  </span>
                )}
              </Button>
            </FeatureGuard>
          ) : (
            <FeatureGuard feature="sales">
              <Button
                className="col-span-1 h-8 text-sm text-white font-bold shadow-lg bg-green-600 hover:bg-green-700"
                onClick={() => setCheckoutOpen(true)}
                disabled={items.length === 0}
              >
                COBRAR
              </Button>
            </FeatureGuard>
          )}
        </div>
      </div>

      {/* ─── MODALES ─── */}
      <PosCheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        selectedCustomer={selectedCustomer}
        onSelectedCustomerChange={setSelectedCustomer}
        usePoints={usePoints}
        onUsePointsChange={setUsePoints}
        appliedCoupon={appliedCoupon}
        onAppliedCouponChange={setAppliedCoupon}
        showCustomerSelector={false}
        showDiscountControls={false}
      />
      <PosReservationModal
        open={reservationOpen}
        onOpenChange={setReservationOpen}
      />
    </div>
  );
}
