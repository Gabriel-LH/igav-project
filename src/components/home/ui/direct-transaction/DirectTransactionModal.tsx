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
import { ReservationCalendar } from "../reservation/ReservationCalendar";
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

  const [receivedAmount, setReceivedAmount] = React.useState<number>(0);

  const [guarantee, setGuarantee] = React.useState("");
  const [guaranteeType, setGuaranteeType] = React.useState<
    "dinero" | "dni" | "joyas" | "otros"
  >("dinero");

  // --------------------
  // Stores
  // --------------------
  const updateStockStatus = useInventoryStore(
    (state) => state.updateStockStatus,
  );

  const sellerId = USER_MOCK[0].id;

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
    if (receivedAmount <= 0) return 0;
    if (receivedAmount < totalACobrarHoy) return 0;
    return receivedAmount - totalACobrarHoy;
  }, [receivedAmount, totalACobrarHoy, paymentMethod]);

  // --------------------
  // Confirmar operación
  // --------------------
  const handleConfirm = () => {
    if (!selectedCustomer) return toast.error("Seleccione un cliente");
    if (!isAvailable || !stockId)
      return toast.error("No hay stock disponible físicamente.");

    const baseData = {
      // productId: item.id,
      // productName: item.name,
      // sku: item.sku,
      // size,
      // color,
      // quantity,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      sellerId,
      branchId: currentBranchId,
      notes,
      createdAt: new Date(),
      // stockId,
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
            type: guaranteeType,
            value: guaranteeType === "dinero" ? guarantee : undefined,
            description: guaranteeType !== "dinero" ? guarantee : undefined,
          },
          paymentMethod,
          receivedAmount: receivedAmount,
          keepAsCredit: false,
        },
        status: "en_curso",
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
              productName: item.name
            },
          ],
          financials: {
            totalAmount: totalOperacion,
            paymentMethod,
            receivedAmount,
            keepAsCredit: false,
            totalPrice: totalOperacion,
          },

          notes,
          status: "vendido",
          id: "",
          operationId: "",
          createdAt: new Date(),
          updatedAt: new Date()
        };

        console.log("saleData", saleData);

        processTransaction(saleData);

        toast.success("Venta realizada correctamente");
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

          {/* Fecha devolución */}
          {type === "alquiler" && (
            <div>
              <Label className="text-[11px] mb-3 font-bold uppercase">
                Fecha de Devolución
              </Label>
              <ReservationCalendar
                mode="single"
                dateRange={{ from: dateRange.to, to: dateRange.to }}
                setDateRange={(val: any) =>
                  setDateRange({ ...dateRange, to: val?.from })
                }
                originBranchId=""
                currentBranchId=""
                rules=""
              />
              <p className="text-[10px] text-blue-300 italic">
                * El alquiler inicia hoy {format(new Date(), "dd/MM")}
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
          <Button
            onClick={handleConfirm}
            className={`w-full h-12 font-black ${
              type === "alquiler"
                ? "text-white bg-linear-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 rounded-base text-sm px-4 py-2.5 text-center leading-5"
                : "text-white bg-linear-to-r from-orange-500 via-orange-600 to-orange-700 hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-orange-300 dark:focus:ring-orange-800 rounded-base text-sm px-4 py-2.5 text-center leading-5"
            }`}
          >
            {type === "alquiler" ? "ENTREGAR Y COBRAR" : "FINALIZAR VENTA"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
