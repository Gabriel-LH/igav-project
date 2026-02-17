import React, { useEffect, useMemo } from "react";
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
import { USER_MOCK } from "@/src/mocks/mock.user";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Input } from "@/components/input";
import { RentalDTO } from "@/src/interfaces/RentalDTO";
import { SaleDTO } from "@/src/interfaces/SaleDTO";

import { PriceBreakdownBase } from "@/src/components/pricing/PriceBreakdownBase";
import { CashPaymentSummary } from "../direct-transaction/CashPaymentSummary";
import { usePriceCalculation } from "@/src/hooks/usePriceCalculation";
import { processTransaction } from "@/src/services/transactionServices";
import { DialogDescription } from "@radix-ui/react-dialog";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";
import { DirectTransactionCalendar } from "./DirectTransactionCalendar";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { Field, FieldGroup } from "@/components/ui/field";
import { Checkbox } from "@/components/checkbox";
import { TimePicker } from "./TimePicker";
import { setHours, setMinutes } from "date-fns";
import { DateTimeContainer } from "./DataTimeContainer";
import { getAvailabilityByAttributes } from "@/src/utils/reservation/checkAvailability";
import { StockAssignmentWidget } from "../widget/StockAssignmentWidget";

export function DirectTransactionModal({
  item,
  size,
  color,
  children,
  currentBranchId,
  type,
  onSuccess,
}: any) {
  const [open, setOpen] = React.useState(false);

  // 1. Creamos referencias para "disparar" los clics
  const pickupDateRef = React.useRef<HTMLButtonElement>(null);
  const pickupTimeRef = React.useRef<HTMLButtonElement>(null);
  const returnDateRef = React.useRef<HTMLButtonElement>(null);
  const returnTimeRef = React.useRef<HTMLButtonElement>(null);

  const businessRules = BUSINESS_RULES_MOCK;

  // --------------------
  // Estados base
  // --------------------
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState("");

  const [assignedStockIds, setAssignedStockIds] = React.useState<string[]>([]);

  const [checklist, setChecklist] = React.useState({
    deliverAfter: false,
    guaranteeAfter: false,
  });

  // Fechas
  const [dateRange, setDateRange] = React.useState<any>({
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
  const [paymentMethod, setPaymentMethod] = React.useState<
    "cash" | "card" | "transfer" | "yape" | "plin"
  >("cash");

  const [receivedAmount, setReceivedAmount] = React.useState<string>("");

  const [guarantee, setGuarantee] = React.useState("");
  const [guaranteeType, setGuaranteeType] =
    React.useState<GuaranteeType>("dinero");

  const [pickupTime, setPickupTime] = React.useState(
    businessRules.openHours.open,
  );
  const [returnTime, setReturnTime] = React.useState(
    businessRules.openHours.close,
  );

  const sellerId = USER_MOCK[0].id;

  // --------------------
  // Stock exacto
  // --------------------
  const { inventoryItems, stockLots } = useInventoryStore();

  // 2️⃣ Paso 2: Filtramos localmente usando useMemo
  const validStockCandidates = useMemo(() => {
    const productId = String(item.id);

    if (item.is_serial) {
      return inventoryItems.filter(
        (s) =>
          String(s.productId) === productId &&
          s.size === size &&
          s.color === color &&
          s.status === "disponible" &&
          (type === "venta" ? s.isForSale : s.isForRent),
      );
    } else {
      return stockLots.filter(
        (s) =>
          String(s.productId) === productId &&
          s.size === size &&
          s.color === color &&
          s.status === "disponible" &&
          (type === "venta" ? s.isForSale : s.isForRent),
      );
    }
  }, [inventoryItems, stockLots, item.id, item.is_serial, size, color, type]);

  // 3. Seleccionamos el mejor candidato
  const selectedStockId = item.is_serial
    ? (validStockCandidates[0] as any)?.serialCode
    : (validStockCandidates[0] as any)?.variantCode;

  const stockCount = useMemo(
    () =>
      validStockCandidates.reduce(
        (acc, curr: any) => acc + (curr.quantity ?? 1),
        0,
      ),
    [validStockCandidates],
  );

  const hasStock = stockCount >= quantity;

  const { days, totalOperacion, isVenta, isEvent } = usePriceCalculation({
    operationType: type,
    priceSell: item.price_sell,
    priceRent: item.price_rent,
    quantity,
    startDate: withTime(dateRange.from, pickupTime),
    endDate:
      type === "alquiler" ? withTime(dateRange.to, returnTime) : undefined,
    rentUnit: item.rent_unit,
    receivedAmount: Number(receivedAmount),
    guaranteeAmount: guaranteeType === "dinero" ? Number(guarantee) : 0,
  });

  const totalACobrarHoy = useMemo(() => {
    if (type === "venta") return totalOperacion;

    return (
      totalOperacion + (guaranteeType === "dinero" ? Number(guarantee || 0) : 0)
    );
  }, [type, totalOperacion, guaranteeType, guarantee]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== "cash") return 0;
    if (Number(receivedAmount) <= 0) return 0;
    if (Number(receivedAmount) < totalACobrarHoy) return 0;
    return Number(receivedAmount) - totalACobrarHoy;
  }, [receivedAmount, totalACobrarHoy, paymentMethod]);

  const validateTransaction = () => {
    const check = getAvailabilityByAttributes(
      item.id,
      size,
      color,
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

  const handleConfirm = () => {
    if (!validateTransaction()) return;
    if (!selectedCustomer) return toast.error("Seleccione un cliente");
    if (!hasStock || !selectedStockId)
      return toast.error(
        `Solo hay ${stockCount} unidades disponibles para ${type}.`,
      );

    let transactionItems: any[] = [];

    if (item.is_serial) {
      if (assignedStockIds.length !== quantity) {
        return toast.error(
          `Debes asignar las ${quantity} prendas específicas en la lista.`,
        );
      }

      transactionItems = assignedStockIds.map((code) => {
        const stockFound = inventoryItems.find((s) => s.serialCode === code);
        return {
          productId: item.id,
          productName: item.name,
          stockId: code,
          quantity: 1,
          size: size,
          color: color,
          priceAtMoment: isVenta ? item.price_sell : item.price_rent,
        };
      });
    } else {
      let remainingQty = quantity;
      for (const lot of validStockCandidates as any[]) {
        if (remainingQty <= 0) break;
        const take = Math.min(remainingQty, lot.quantity);
        transactionItems.push({
          productId: item.id,
          productName: item.name,
          stockId: lot.variantCode,
          quantity: take,
          size: size,
          color: color,
          priceAtMoment: isVenta ? item.price_sell : item.price_rent,
        });
        remainingQty -= take;
      }
    }

    const baseData = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
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
          totalRent: totalOperacion,
          guarantee: {
            type: !checklist.guaranteeAfter ? guaranteeType : "por_cobrar",
            value: guaranteeType === "dinero" ? guarantee : undefined,
            description: guaranteeType !== "dinero" ? guarantee : undefined,
          },
          paymentMethod,
          receivedAmount: Number(receivedAmount),
          keepAsCredit: false,
        },
        status: !checklist.deliverAfter ? "alquilado" : "reservado_fisico",
        id: "",
        operationId: "",
        items: transactionItems,
        updatedAt: new Date(),
      };

      processTransaction(rentalData);
      if (rentalData.status === "alquilado") {
        toast.success("Alquiler realizado correctamente");
      } else {
        toast.success("Registro para entrega posterior exitoso");
      }
      setOpen(false);
      onSuccess?.();
    }

    if (type === "venta") {
      const saleData: SaleDTO = {
        type: "venta",
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        sellerId,
        branchId: currentBranchId,
        items: transactionItems,
        financials: {
          totalAmount: totalOperacion,
          paymentMethod,
          receivedAmount: Number(receivedAmount),
          keepAsCredit: false,
          totalPrice: totalOperacion,
          downPayment: 0,
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

      processTransaction(saleData);
      if (!checklist.deliverAfter) {
        toast.success("Venta realizada correctamente");
      } else {
        toast.success("Registro para entrega posterior exitoso");
      }
      setOpen(false);
      onSuccess?.();
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
              {size || "S/T"}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold uppercase">{item.name}</h4>
              <p className="text-[10px] text-muted-foreground">
                Color: {color} | SKU: {item.sku}
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
                    setDateRange({ ...dateRange, from: date })
                  }
                  mode="pickup"
                  productId={item.id}
                  size={size}
                  color={color}
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
                      setDateRange({ ...dateRange, to: date })
                    }
                    mode="return"
                    type={type}
                    productId={item.id}
                    size={size}
                    color={color}
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

          <div className="space-y-4">
            <PriceBreakdownBase
              unitPrice={isVenta ? item.price_sell : item.price_rent}
              quantity={quantity}
              days={days}
              isEvent={isEvent}
              total={totalOperacion}
            />
          </div>

          <CashPaymentSummary
            checklist={checklist}
            type={type}
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
                size={size}
                isImmediate={true}
                color={color}
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
