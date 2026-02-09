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
import { Calendar02Icon, SaleTag02Icon } from "@hugeicons/core-free-icons";
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

  // --------------------
  // Estados base
  // --------------------
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState("");

  // Fechas
  const [dateRange, setDateRange] = React.useState<any>({
    from: new Date(),
    to: type === "alquiler" ? addDays(new Date(), 3) : new Date(),
  });

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

  const sellerId = USER_MOCK[0].id;

  const businessRules = BUSINESS_RULES_MOCK

  // --------------------
  // Stock exacto
  // --------------------
  const exactStockItem = useInventoryStore((state) =>
    state.stock.find(
      (s) =>
        String(s.productId) === String(item.id) &&
        s.size === size &&
        s.color === color &&
        s.status === "disponible",
    ),
  );

  const stockId = exactStockItem?.id;
  const isAvailable = !!exactStockItem;

  const { days, totalOperacion, isVenta, isEvent } = usePriceCalculation({
    operationType: type,
    priceSell: item.price_sell,
    priceRent: item.price_rent,
    quantity,
    startDate: dateRange?.from,
    endDate: dateRange?.to,
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

  // --------------------
  // Confirmar operación
  // --------------------
  const handleConfirm = (deliverInmediatly: boolean) => {
    if (!selectedCustomer) return toast.error("Seleccione un cliente");
    if (!isAvailable || !stockId)
      return toast.error("No hay stock disponible físicamente.");

    const baseData = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      sellerId,
      branchId: currentBranchId,
      notes,
      createdAt: new Date(),
    };

    console.log("Tipo de garantia", guaranteeType);
    console.log("Valor de garantia", guarantee);

    if (type === "alquiler") {
      const rentalData: RentalDTO = {
        ...baseData,
        type: "alquiler",
        startDate: dateRange.from,
        endDate: dateRange.to,
        financials: {
          totalRent: totalOperacion,
          guarantee: {
            type: guaranteeType,
            value: guaranteeType === "dinero" ? guarantee : undefined,
            description: guaranteeType !== "dinero" ? guarantee : undefined,
          },
          paymentMethod,
          receivedAmount: Number(receivedAmount),
          keepAsCredit: false,
        },
        status: deliverInmediatly ? "alquilado" : "reservado_fisico",
        id: "",
        operationId: "",
        items: [
          {
            productId: item.id,
            productName: item.name,
            stockId: stockId,
            quantity: quantity,
            size: size,
            color: color,
            priceAtMoment: item.price_rent,
          },
        ],
        updatedAt: new Date(),
      };

      processTransaction(rentalData);
      toast.success("Alquiler realizado correctamente");
      setOpen(false);
      onSuccess?.();
    }

    if (type === "venta") {
      if (!selectedCustomer) return toast.error("Seleccione un cliente");

      if (!isAvailable || !stockId)
        return toast.error("No hay stock disponible físicamente.");

      const saleData: SaleDTO = {
        type: "venta",
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        sellerId,
        branchId: currentBranchId,

        items: [
          {
            productId: item.id,
            stockId,
            quantity,
            size,
            color,
            priceAtMoment: item.price_sell,
            productName: item.name,
          },
        ],
        financials: {
          totalAmount: totalOperacion,
          paymentMethod,
          receivedAmount: Number(receivedAmount),
          keepAsCredit: false,
          totalPrice: totalOperacion,
          downPayment: 0,
        },

        notes,
        status: deliverInmediatly ? "vendido" : "pendiente_entrega",
        id: "",
        operationId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      processTransaction(saleData);

      if (deliverInmediatly) {
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

        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
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
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="h-8 font-bold"
              />
            </div>
          </div>

          {/* Bloque de Fechas */}
          <div className="grid grid-cols-2 gap-4">
            {/* FECHA DE INICIO / RECOJO */}
            <div>
              <Label className="text-[11px] font-bold uppercase">
                {type === "venta"
                  ? "Fecha de Recojo"
                  : "Fecha de Inicio Alquiler"}
              </Label>
              <DirectTransactionCalendar
                maxDays={type === "venta" ? businessRules.maxDaysSale : businessRules.maxDaysRental}
                mode="pickup"
                selectedDate={dateRange.from}
                onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                label="¿Cuándo viene?"
              />
            </div>
            {/* FECHA DE DEVOLUCIÓN */}
            {type === "alquiler" && (
              <div>
                <Label className="text-[11px] font-bold uppercase">
                  Fecha de Devolución
                </Label>
                <DirectTransactionCalendar
                  mode="return"
                  minDate={dateRange.from} // No puede devolverlo antes de recogerlo
                  selectedDate={dateRange.to}
                  onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                  label="¿Cuándo entrega?"
                />
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

          {/* BLOQUES FINANCIEROS */}

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
        </div>

        {!isAvailable ? (
          <Button disabled className="bg-red-600">
            STOCK NO DISPONIBLE
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => handleConfirm(false)}
              className={`flex-1 h-12 font-black ${
                type === "alquiler"
                  ? "text-white bg-linear-to-r from-blue-400 via-blue-500 to-blue-600 hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-700 rounded-base text-sm px-4 py-2.5 text-center leading-5"
                  : "text-white bg-linear-to-r from-orange-400 via-orange-500 to-orange-600 hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-orange-200 dark:focus:ring-orange-700 rounded-base text-sm px-4 py-2.5 text-center leading-5"
              }`}
            >
              {type === "alquiler" ? "ENTREGAR DESPUES" : "ENTREGAR DESPUES"}
            </Button>
            <Button
              onClick={() => handleConfirm(true)}
              className={`flex-1 h-12 font-black ${
                type === "alquiler"
                  ? "text-white bg-linear-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 rounded-base text-sm px-4 py-2.5 text-center leading-5"
                  : "text-white bg-linear-to-r from-orange-500 via-orange-600 to-orange-700 hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-orange-300 dark:focus:ring-orange-800 rounded-base text-sm px-4 py-2.5 text-center leading-5"
              }`}
            >
              {type === "alquiler" ? "ENTREGAR AHORA" : "ENTREGAR AHORA"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
